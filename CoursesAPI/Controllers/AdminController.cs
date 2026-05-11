using CoursesAPI.Data;
using CoursesAPI.Dtos.Admin;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using System.Security.Claims;
using CoursesAPI.Dtos.Feedback;

namespace CoursesAPI.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IS3Interface _s3;
    private readonly INotificationService _notifications;

    public AdminController(
        ApplicationDbContext context,
        UserManager<User> userManager,
        IS3Interface s3,
        INotificationService notifications)
    {
        _context = context;
        _userManager = userManager;
        _s3 = s3;
        _notifications = notifications;
    }

    private static bool IsLockedOut(User user) =>
        user.LockoutEnd != null && user.LockoutEnd.Value > DateTimeOffset.UtcNow;

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 50;

        var query = _userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var like = $"%{search.Trim().ToLower()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.UserName ?? string.Empty, like) ||
                EF.Functions.ILike(u.Email ?? string.Empty, like) ||
                EF.Functions.ILike(u.TelegramUsername ?? string.Empty, like));
        }

        var users = await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new List<UserListItemDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var primaryRole = roles.FirstOrDefault() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(role) && !string.Equals(primaryRole, role, StringComparison.OrdinalIgnoreCase))
                continue;

            var ownedCount = await _context.Courses.CountAsync(c => c.OwnerId == u.Id);
            var enrolledCount = await _context.CourseProgresses.CountAsync(cp => cp.UserId == u.Id);

            result.Add(new UserListItemDto
            {
                Id = u.Id,
                Username = u.UserName,
                Email = u.Email,
                TelegramUsername = u.TelegramUsername,
                Role = primaryRole,
                OwnedCoursesCount = ownedCount,
                EnrolledCoursesCount = enrolledCount,
                IsBlocked = IsLockedOut(u)
            });
        }

        return Ok(result);
    }

    [HttpGet("users/{id}")]
    public async Task<ActionResult<UserDetailDto>> GetUser(string id)
    {
        var user = await _userManager.Users
            .Include(u => u.OwnedCourses)
            .Include(u => u.CourseProgresses).ThenInclude(cp => cp.Course)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? string.Empty;

        var owned = user.OwnedCourses
            .Select(c => new AdminCourseSummaryDto { Id = c.Id, Title = c.Title })
            .ToList();

        var enrolled = user.CourseProgresses
            .Where(cp => cp.Course != null)
            .Select(cp => new AdminCourseSummaryDto
            {
                Id = cp.CourseId,
                Title = cp.Course.Title,
                CompletionPercentage = cp.CompletionPercentage
            })
            .ToList();

        var avg = enrolled.Count > 0 ? enrolled.Average(c => c.CompletionPercentage ?? 0) : 0;

        return Ok(new UserDetailDto
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            TelegramUsername = user.TelegramUsername,
            TelegramUserId = user.TelegramUserId,
            ProfilePhotoUrl = string.IsNullOrEmpty(user.ProfilePhotoKey) ? null : _s3.GetFileUrl(user.ProfilePhotoKey),
            Role = primaryRole,
            BirthdayDate = user.BirthdayDate,
            OwnedCourses = owned,
            EnrolledCourses = enrolled,
            AverageCompletion = avg,
            IsBlocked = IsLockedOut(user),
            BlockedUntil = user.LockoutEnd
        });
    }

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] RoleChangeRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Role))
            return BadRequest("Role is required.");

        var allowed = new[] { Roles.Admin, Roles.Teacher, Roles.User };
        if (!allowed.Contains(request.Role))
            return BadRequest($"Role must be one of: {string.Join(", ", allowed)}.");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var currentRoles = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
            return BadRequest(removeResult.Errors.Select(e => e.Description));

        var addResult = await _userManager.AddToRoleAsync(user, request.Role);
        if (!addResult.Succeeded)
            return BadRequest(addResult.Errors.Select(e => e.Description));

        return NoContent();
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var ownsCourses = await _context.Courses.AnyAsync(c => c.OwnerId == id);
        if (ownsCourses)
            return Conflict("Cannot delete a user who owns courses. Transfer ownership first.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        return NoContent();
    }

    [HttpGet("teachers")]
    public async Task<ActionResult<IEnumerable<TeacherListItemDto>>> GetTeachers()
    {
        var teachers = await _userManager.GetUsersInRoleAsync(Roles.Teacher);

        var result = new List<TeacherListItemDto>(teachers.Count);
        foreach (var t in teachers)
        {
            var ownedIds = await _context.Courses
                .Where(c => c.OwnerId == t.Id)
                .Select(c => c.Id)
                .ToListAsync();

            var students = ownedIds.Count == 0
                ? 0
                : await _context.CourseProgresses
                    .Where(cp => ownedIds.Contains(cp.CourseId))
                    .Select(cp => cp.UserId)
                    .Distinct()
                    .CountAsync();

            var avg = ownedIds.Count == 0
                ? 0
                : await _context.CourseProgresses
                    .Where(cp => ownedIds.Contains(cp.CourseId))
                    .Select(cp => (double?)cp.CompletionPercentage)
                    .AverageAsync() ?? 0;

            result.Add(new TeacherListItemDto
            {
                Id = t.Id,
                Username = t.UserName,
                Email = t.Email,
                TelegramUsername = t.TelegramUsername,
                ProfilePhotoUrl = string.IsNullOrEmpty(t.ProfilePhotoKey) ? null : _s3.GetFileUrl(t.ProfilePhotoKey),
                OwnedCoursesCount = ownedIds.Count,
                TotalStudents = students,
                AverageStudentCompletion = avg
            });
        }

        return Ok(result.OrderByDescending(t => t.OwnedCoursesCount).ToList());
    }

    [HttpGet("courses")]
    public async Task<ActionResult<IEnumerable<CourseAggregateDto>>> GetAllCourses()
    {
        var courses = await _context.Courses
            .AsNoTracking()
            .Include(c => c.Owner)
            .Include(c => c.Lessons)
            .ToListAsync();

        var courseIds = courses.Select(c => c.Id).ToList();
        var enrollments = await _context.CourseProgresses
            .Where(cp => courseIds.Contains(cp.CourseId))
            .GroupBy(cp => cp.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count(), Avg = g.Average(x => x.CompletionPercentage) })
            .ToDictionaryAsync(x => x.CourseId);

        var dtos = courses.Select(c => new CourseAggregateDto
        {
            Id = c.Id,
            Title = c.Title,
            Description = c.Description,
            PreviewPhotoUrl = string.IsNullOrEmpty(c.PreviewPhotoKey) ? null : _s3.GetFileUrl(c.PreviewPhotoKey),
            OwnerId = c.OwnerId,
            OwnerUsername = c.Owner?.UserName,
            CreateDate = c.CreateDate,
            EndDate = c.EndDate,
            LessonsCount = c.Lessons?.Count ?? 0,
            EnrolledUsersCount = enrollments.TryGetValue(c.Id, out var e) ? e.Count : 0,
            AverageCompletion = enrollments.TryGetValue(c.Id, out var e2) ? e2.Avg : 0
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("stats/overview")]
    public async Task<ActionResult<PlatformStatsDto>> GetOverviewStats()
    {
        var admins = await _userManager.GetUsersInRoleAsync(Roles.Admin);
        var teachers = await _userManager.GetUsersInRoleAsync(Roles.Teacher);
        var students = await _userManager.GetUsersInRoleAsync(Roles.User);

        var totalCourses = await _context.Courses.CountAsync();
        var totalLessons = await _context.Lessons.CountAsync();
        var totalTests = await _context.Tests.CountAsync();
        var activeEnrollments = await _context.CourseProgresses.CountAsync();
        var avg = await _context.CourseProgresses.AnyAsync()
            ? await _context.CourseProgresses.AverageAsync(cp => cp.CompletionPercentage)
            : 0;
        var completed = await _context.CourseProgresses.CountAsync(cp => cp.CompletionPercentage >= 0.9);

        var topCourses = await _context.CourseProgresses
            .Include(cp => cp.Course)
            .GroupBy(cp => new { cp.CourseId, cp.Course.Title })
            .Select(g => new TopCourseDto
            {
                Id = g.Key.CourseId,
                Title = g.Key.Title,
                Enrollments = g.Count(),
                AverageCompletion = g.Average(x => x.CompletionPercentage)
            })
            .OrderByDescending(x => x.Enrollments)
            .Take(5)
            .ToListAsync();

        var teacherStats = new List<TopTeacherDto>();
        foreach (var t in teachers)
        {
            var courseIds = await _context.Courses.Where(c => c.OwnerId == t.Id).Select(c => c.Id).ToListAsync();
            var studentCount = courseIds.Count == 0 ? 0 :
                await _context.CourseProgresses
                    .Where(cp => courseIds.Contains(cp.CourseId))
                    .Select(cp => cp.UserId)
                    .Distinct()
                    .CountAsync();
            teacherStats.Add(new TopTeacherDto
            {
                Id = t.Id,
                Username = t.UserName,
                CoursesCount = courseIds.Count,
                StudentsCount = studentCount
            });
        }

        return Ok(new PlatformStatsDto
        {
            TotalUsers = await _userManager.Users.CountAsync(),
            TotalStudents = students.Count,
            TotalTeachers = teachers.Count,
            TotalAdmins = admins.Count,
            TotalCourses = totalCourses,
            TotalLessons = totalLessons,
            TotalTests = totalTests,
            ActiveEnrollments = activeEnrollments,
            AverageCompletion = avg,
            CompletedCourses = completed,
            TopCourses = topCourses,
            TopTeachers = teacherStats.OrderByDescending(t => t.StudentsCount).Take(5).ToList()
        });
    }

    [HttpGet("stats/courses")]
    public async Task<ActionResult<IEnumerable<TopCourseDto>>> GetCourseStats()
    {
        var courses = await _context.Courses
            .AsNoTracking()
            .Select(c => new { c.Id, c.Title })
            .ToListAsync();

        var progressByCourse = await _context.CourseProgresses
            .GroupBy(cp => cp.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                Count = g.Count(),
                Avg = g.Average(x => x.CompletionPercentage)
            })
            .ToDictionaryAsync(x => x.CourseId);

        var stats = courses
            .Select(c => new TopCourseDto
            {
                Id = c.Id,
                Title = c.Title,
                Enrollments = progressByCourse.TryGetValue(c.Id, out var p) ? p.Count : 0,
                AverageCompletion = progressByCourse.TryGetValue(c.Id, out var p2) ? p2.Avg : 0
            })
            .OrderByDescending(x => x.Enrollments)
            .ToList();

        return Ok(stats);
    }

    [HttpGet("stats/timeseries")]
    public async Task<ActionResult<IEnumerable<TimeseriesPointDto>>> GetTimeseries(
        [FromQuery] string metric = "enrollments",
        [FromQuery] int days = 30)
    {
        if (days < 1) days = 30;
        if (days > 365) days = 365;

        var since = DateTime.UtcNow.Date.AddDays(-days + 1);
        var sinceUtc = DateTime.SpecifyKind(since, DateTimeKind.Utc);

        List<DateTime> raw;
        switch (metric.ToLowerInvariant())
        {
            case "courses":
                raw = await _context.Courses
                    .Where(c => c.CreateDate >= sinceUtc)
                    .Select(c => c.CreateDate)
                    .ToListAsync();
                break;
            case "completions":
                raw = await _context.CourseProgresses
                    .Where(cp => cp.StartDate != null && cp.StartDate >= sinceUtc && cp.CompletionPercentage >= 0.9)
                    .Select(cp => cp.StartDate!.Value)
                    .ToListAsync();
                break;
            case "enrollments":
            default:
                raw = await _context.CourseProgresses
                    .Where(cp => cp.StartDate != null && cp.StartDate >= sinceUtc)
                    .Select(cp => cp.StartDate!.Value)
                    .ToListAsync();
                break;
        }

        var counts = raw
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => (double)g.Count());

        var dense = Enumerable.Range(0, days)
            .Select(i => since.AddDays(i))
            .Select(d => new TimeseriesPointDto { Date = d, Value = counts.TryGetValue(d, out var v) ? v : 0 })
            .ToList();

        return Ok(dense);
    }

    [HttpGet("export/overview.xlsx")]
    public async Task<IActionResult> ExportOverview()
    {
        using var package = new ExcelPackage();

        // Users
        var users = await _userManager.Users.AsNoTracking().ToListAsync();
        var userRolesMap = new Dictionary<string, string>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            userRolesMap[u.Id] = roles.FirstOrDefault() ?? "";
        }

        var usersSheet = package.Workbook.Worksheets.Add("Users");
        WriteHeader(usersSheet, new[] { "Username", "Email", "Role", "Telegram", "Blocked", "Created" });
        var rowU = 2;
        foreach (var u in users.OrderBy(u => u.UserName))
        {
            usersSheet.Cells[rowU, 1].Value = u.UserName;
            usersSheet.Cells[rowU, 2].Value = u.Email;
            usersSheet.Cells[rowU, 3].Value = userRolesMap.TryGetValue(u.Id, out var r) ? r : "";
            usersSheet.Cells[rowU, 4].Value = u.TelegramUsername;
            usersSheet.Cells[rowU, 5].Value = (u.LockoutEnd != null && u.LockoutEnd.Value > DateTimeOffset.UtcNow) ? "yes" : "";
            usersSheet.Cells[rowU, 6].Value = u.BirthdayDate == DateTime.MinValue ? null : u.BirthdayDate.ToString("yyyy-MM-dd");
            rowU++;
        }
        usersSheet.Cells[usersSheet.Dimension.Address].AutoFitColumns();

        // Courses
        var courses = await _context.Courses.AsNoTracking()
            .Include(c => c.Owner)
            .Include(c => c.Lessons)
            .ToListAsync();
        var enrollmentsByCourse = await _context.CourseProgresses
            .GroupBy(cp => cp.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count(), Avg = g.Average(x => x.CompletionPercentage) })
            .ToDictionaryAsync(x => x.CourseId);

        var coursesSheet = package.Workbook.Worksheets.Add("Courses");
        WriteHeader(coursesSheet, new[] { "Title", "Owner", "Lessons", "Enrollments", "AvgCompletion", "Created", "Ends" });
        var rowC = 2;
        foreach (var c in courses.OrderBy(c => c.Title))
        {
            coursesSheet.Cells[rowC, 1].Value = c.Title;
            coursesSheet.Cells[rowC, 2].Value = c.Owner?.UserName;
            coursesSheet.Cells[rowC, 3].Value = c.Lessons?.Count ?? 0;
            coursesSheet.Cells[rowC, 4].Value = enrollmentsByCourse.TryGetValue(c.Id, out var e) ? e.Count : 0;
            coursesSheet.Cells[rowC, 5].Value = enrollmentsByCourse.TryGetValue(c.Id, out var e2)
                ? Math.Round(e2.Avg * 100, 1) + "%" : "0%";
            coursesSheet.Cells[rowC, 6].Value = c.CreateDate.ToString("yyyy-MM-dd");
            coursesSheet.Cells[rowC, 7].Value = c.EndDate.ToString("yyyy-MM-dd");
            rowC++;
        }
        if (coursesSheet.Dimension != null)
            coursesSheet.Cells[coursesSheet.Dimension.Address].AutoFitColumns();

        // Enrollments
        var progresses = await _context.CourseProgresses.AsNoTracking()
            .Include(cp => cp.User)
            .Include(cp => cp.Course)
            .ToListAsync();

        var enrollSheet = package.Workbook.Worksheets.Add("Enrollments");
        WriteHeader(enrollSheet, new[] { "User", "Course", "CompletionPercent", "StartDate" });
        var rowE = 2;
        foreach (var p in progresses.OrderByDescending(p => p.CompletionPercentage))
        {
            enrollSheet.Cells[rowE, 1].Value = p.User?.UserName;
            enrollSheet.Cells[rowE, 2].Value = p.Course?.Title;
            enrollSheet.Cells[rowE, 3].Value = Math.Round(p.CompletionPercentage * 100, 1);
            enrollSheet.Cells[rowE, 4].Value = p.StartDate?.ToString("yyyy-MM-dd");
            rowE++;
        }
        if (enrollSheet.Dimension != null)
            enrollSheet.Cells[enrollSheet.Dimension.Address].AutoFitColumns();

        // Test results
        var results = await _context.TestResults.AsNoTracking()
            .Include(tr => tr.User)
            .Include(tr => tr.Test).ThenInclude(t => t.Lesson)
            .OrderByDescending(tr => tr.SubmissionDate)
            .Take(5000)
            .ToListAsync();

        var testsSheet = package.Workbook.Worksheets.Add("TestResults");
        WriteHeader(testsSheet, new[] { "User", "Lesson", "Question", "Score", "SubmittedAt" });
        var rowT = 2;
        foreach (var r in results)
        {
            testsSheet.Cells[rowT, 1].Value = r.User?.UserName;
            testsSheet.Cells[rowT, 2].Value = r.Test?.Lesson?.Name;
            testsSheet.Cells[rowT, 3].Value = r.Test?.Question;
            testsSheet.Cells[rowT, 4].Value = r.Score;
            testsSheet.Cells[rowT, 5].Value = r.SubmissionDate.ToString("yyyy-MM-dd HH:mm");
            rowT++;
        }
        if (testsSheet.Dimension != null)
            testsSheet.Cells[testsSheet.Dimension.Address].AutoFitColumns();

        var bytes = await package.GetAsByteArrayAsync();
        var fileName = $"Platform_Overview_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static void WriteHeader(ExcelWorksheet sheet, string[] headers)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = sheet.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(18, 18, 31));
            cell.Style.Font.Color.SetColor(Color.White);
        }
    }

    [HttpPost("users/{id}/block")]
    public async Task<IActionResult> BlockUser(string id, [FromBody] BlockRequestDto? request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var meId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (user.Id == meId) return BadRequest("You cannot block yourself.");

        if (!user.LockoutEnabled)
        {
            user.LockoutEnabled = true;
        }
        // Postgres `timestamp with time zone` overflows on DateTimeOffset.MaxValue;
        // use year 9000 as a "forever" sentinel that's safely representable.
        user.LockoutEnd = new DateTimeOffset(9000, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
            return BadRequest(update.Errors.Select(e => e.Description));

        var reason = string.IsNullOrWhiteSpace(request?.Reason) ? "Аккаунт заблокирован администратором." : request!.Reason!;
        await _notifications.CreateAsync(
            user.Id,
            type: "block",
            title: "Аккаунт заблокирован",
            body: reason);

        return NoContent();
    }

    [HttpPost("users/{id}/unblock")]
    public async Task<IActionResult> UnblockUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        user.LockoutEnd = null;
        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
            return BadRequest(update.Errors.Select(e => e.Description));

        await _notifications.CreateAsync(
            user.Id,
            type: "unblock",
            title: "Аккаунт разблокирован",
            body: "Ваш аккаунт снова активен.");

        return NoContent();
    }

    [HttpGet("feedback")]
    public async Task<ActionResult<IEnumerable<FeedbackDto>>> ListFeedback([FromQuery] string? status = null)
    {
        var query = _context.Feedbacks.AsNoTracking().Include(f => f.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(f => f.Status == status);

        var list = await query.OrderByDescending(f => f.CreatedAt).Take(500).ToListAsync();
        return Ok(list.Select(f => new FeedbackDto
        {
            Id = f.Id,
            UserId = f.UserId,
            Username = f.User?.UserName,
            Email = f.User?.Email,
            Subject = f.Subject,
            Message = f.Message,
            Status = f.Status,
            AdminReply = f.AdminReply,
            CreatedAt = f.CreatedAt,
            RepliedAt = f.RepliedAt,
        }));
    }

    [HttpPatch("feedback/{id}")]
    public async Task<IActionResult> ReplyToFeedback(int id, [FromBody] FeedbackReplyDto dto)
    {
        var item = await _context.Feedbacks.FirstOrDefaultAsync(f => f.Id == id);
        if (item == null) return NotFound();

        var meId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!string.IsNullOrWhiteSpace(dto.Reply))
        {
            item.AdminReply = dto.Reply.Trim();
            item.RepliedByUserId = meId;
            item.RepliedAt = DateTime.UtcNow;
            item.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Replied" : dto.Status;

            await _notifications.CreateAsync(
                item.UserId,
                type: "feedback_reply",
                title: $"Ответ на «{item.Subject}»",
                body: item.AdminReply);
        }
        else if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            var allowed = new[] { "Open", "Replied", "Closed" };
            if (!allowed.Contains(dto.Status))
                return BadRequest($"Status must be one of: {string.Join(", ", allowed)}");
            item.Status = dto.Status;
        }
        else
        {
            return BadRequest("Either Reply or Status is required.");
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
