using System.Security.Claims;
using System.Text;
using CoursesAPI.Dtos.Course;
using CoursesAPI.Dtos.Lesson;
using CoursesAPI.Dtos.Platform;
using CoursesAPI.Dtos.User;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace CoursesAPI.Controllers
{
    [Route("api/courses")]
    [ApiController]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseInterface _courseRepository;
        private readonly ILessonInterface _lessonRepository;
        private readonly ICourseProgressInterface _courseProgressRepository;
        private readonly UserManager<User> _userManager;
        private readonly IS3Interface _s3;

        public CoursesController(ICourseInterface courseRepository, UserManager<User> userManager, ICourseProgressInterface courseProgressRepository, IS3Interface s3, ILessonProgressInterface lessonProgressRepository, ILessonInterface lessonRepository)
        {
            _courseRepository = courseRepository;
            _userManager = userManager;
            _courseProgressRepository = courseProgressRepository;
            _s3 = s3;
            _lessonRepository = lessonRepository;
            _lessonRepository = lessonRepository;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseViewModelDto>>> GetCourses()
        {
            var courses = await _courseRepository.GetAllCoursesAsync();

            if (courses == null)
            {
                return Ok(new List<CourseViewModelDto>());
            }
            var courseViewModels = courses.Select(c => new CourseViewModelDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                PreviewPhotoKey = _s3.GetFileUrl(c.PreviewPhotoKey),
                Admins = c.Admins
            }).ToList();

            return Ok(courseViewModels);
        }
        [HttpGet]
        [Route("userprogress")]
        public async Task<ActionResult<List<CourseProgressDto>>> GetUserProgress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
            var courseProgresses = await _courseProgressRepository.GetCourseProgressByUserIdAsync(userId);
            if (courseProgresses == null)
            {
                return NotFound($"Прогресс не найден");
            }
            return courseProgresses.Select(cp => new CourseProgressDto { Username = user.UserName, CourseName = cp.Course.Title, CompletionPercentage = cp.CompletionPercentage, }).ToList();
        }

        [HttpGet]
        [Route("platformprogress")]
        public async Task<ActionResult<PlatformViewModelDto>> GetPlatformProgress()
        {
            var userCount = _userManager.Users.Count(x => x.TelegramUsername != null);
            var coursesCount = _courseRepository.GetCoursesCount();
            var courseProgresses = await _courseProgressRepository.GetCourseProgressesAsync();
            var completedCourses = courseProgresses.Count(c => c.CompletionPercentage > 0.9);
            Dictionary<string, double> threeCourses = new Dictionary<string, double>(); 
            if (courseProgresses.Any())
            {
                var topCourseProgresses = courseProgresses
                        .Where(cp => cp.Course != null && !string.IsNullOrEmpty(cp.Course.Title))
                        .GroupBy(cp => cp.CourseId)
                        .Select(g => new
                        {
                            CourseName = g.First().Course.Title, 
                            MaxPercentage = g.Max(cp => cp.CompletionPercentage) 
                        })
                        .OrderByDescending(courseData => courseData.MaxPercentage)
                        .Take(3);
                threeCourses = topCourseProgresses.ToDictionary(item => item.CourseName, item => item.MaxPercentage);
            }
            var bestUsers = new List<string>();
            var bestProgress = courseProgresses.OrderByDescending(x => x.CompletionPercentage).Take(3);
            foreach (var progress in bestProgress)
                bestUsers.Add(progress.User.UserName);
            
            return new PlatformViewModelDto
            {
                AllUsersCount = userCount,
                AllCoursesCount = coursesCount,
                AllCompletedCoursesCount = completedCourses,
                BestUsers = bestUsers,
                ThreeCourses = threeCourses
            };
        }
        
        [HttpGet]
        [Route("admincoursesprogress")]
        public async Task<ActionResult<CourseProgressForAdminDto>> GetAdminCoursesProgress()
        {
            var usersCount = 0;
            var coursesCount = 0;
            var courseProgressesCount = 0;
            double complPercentage = 0.0f;
            
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var courses = await _courseRepository.GetOwnedCoursesByIdAsync(adminId);
            foreach (var course in courses)
            {
                usersCount += course.Users?.Count ?? 0;
                coursesCount++;
                var courseProgresses = await _courseProgressRepository.GetCourseProgressByCourseIdAsync(course.Id);
                foreach (var cp in courseProgresses)
                {
                    courseProgressesCount++;
                    complPercentage += cp.CompletionPercentage;
                }
            }
            return new CourseProgressForAdminDto
            {
                UsersCount = usersCount,
                CoursesCount = courses.Count,
                CompletionPercentage = courseProgressesCount != 0 ? complPercentage/courseProgressesCount : 0  
            };
        }
        [HttpGet]
        [Route("{courseId}/allusersprogress")]
        public async Task<ActionResult<List<CourseProgressDto>>> GetUsersProgress(int courseId)
        {

            var courseProgresses = await _courseProgressRepository.GetCourseProgressByCourseIdAsync(courseId);

            if (courseProgresses == null || !courseProgresses.Any()) 
            {
                return NotFound();
            }

            var courseProgressesList = courseProgresses.Select(cp => new CourseProgressDto
            {
                Username = cp.User.UserName, 
                CompletionPercentage = cp.CompletionPercentage,
                LessonProgresses = cp.LessonProgresses.Select(l => new LessonProgressDto
                {
                    IsCompleted = l.IsCompleted,
                    LessonId = l.LessonId,
                    LessonName = l.Lesson?.Name,
                    TestScore = $"{l.Score}/{l.Lesson?.Tests?.Count}" 
                }).ToList()
            }).ToList(); 

            
            return courseProgressesList;
        }



    [HttpGet]
[Route("{courseId}/usersprogress/download")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<string>> DownloadUsersProgressExcel(int courseId)
{
    var course = await _courseRepository.GetCourseByIdAsync(courseId);
    if (course?.Lessons == null)
    {
        return NotFound("Курс или его уроки не найдены.");
    }

    var lessons = course.Lessons.OrderBy(l => l.Id).ToList();
    var allCourseProgresses = await _courseProgressRepository.GetCourseProgressByCourseIdAsync(courseId);

    if (allCourseProgresses == null || !allCourseProgresses.Any())
    {
        return NotFound($"Прогрессы для курса {courseId} не найдены");
    }

    
    using var excelPackage = new ExcelPackage();
    var worksheet = excelPackage.Workbook.Worksheets.Add("Progress Report");

    worksheet.Cells[1, 1].Value = "Username";
    worksheet.Cells[1, 2].Value = "Completion Percentage";

    for (int i = 0; i < lessons.Count; i++)
    {
        worksheet.Cells[1, i + 3].Value = $"{lessons[i].Name} Score";
    }

    int row = 2;
    foreach (var userProgress in allCourseProgresses)
    {
        if (userProgress.User == null) continue;

        worksheet.Cells[row, 1].Value = userProgress.User.UserName;
        worksheet.Cells[row, 2].Value = $"{userProgress.CompletionPercentage:F2}%";

        var userLessonProgresses = userProgress.LessonProgresses?.ToDictionary(lp => lp.LessonId) 
            ?? new Dictionary<int, LessonProgress>();

        for (int i = 0; i < lessons.Count; i++)
        {
            var lesson = lessons[i];
            if (userLessonProgresses.TryGetValue(lesson.Id, out var lessonProgress))
            {
                var totalTests = _lessonRepository.GetLessonByIdAsync(lesson.Id).Result?.Tests.Count;
                worksheet.Cells[row, i + 3].Value = $"{lessonProgress.Score}/{totalTests}";
            }
            else
            {
                worksheet.Cells[row, i + 3].Value = "-";
            }
        }
        row++;
    }

    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

    using var memoryStream = new MemoryStream();
    await excelPackage.SaveAsAsync(memoryStream);
    memoryStream.Position = 0;

    var fileName = $"Course_{courseId}_Progress_Report.xlsx";
    var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    var formFieldName = "reportFile";

    IFormFile generatedFormFile = new Helpers.StringAsFormFile(
        memoryStream,
        formFieldName,
        fileName,
        contentType
    );
    
    var filePath = $"courses/course{courseId}";
    var uploadedFile = await _s3.UploadFileAsync(generatedFormFile, filePath);
    var url = _s3.GetFileUrl(uploadedFile);
    return url;
}

        [HttpGet("{courseId}")]
        public async Task<ActionResult<CourseViewModelDto>> GetCourse(int courseId)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound($"Курс с ID {courseId} не найден.");
            }
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            bool isOwner = course.OwnerId == currentUserId;
            bool isAdmin = User.IsInRole("Admin");
            bool isEnrolled = false;

            if (!isOwner && !isAdmin)
            {
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized("Не удалось определить пользователя для проверки записи на курс.");
                }
                isEnrolled = await _courseRepository.IsUserEnrolledAsync(courseId, currentUserId);
            }

            if (!isOwner && !isAdmin && !isEnrolled)
            {
                return Forbid();
            }


            var courseViewModel = new CourseViewModelDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                OwnerId = course.OwnerId,
                Admins = course.Admins,
                PreviewPhotoKey = _s3.GetFileUrl(course.PreviewPhotoKey),
                CreateDate = course.CreateDate,
                EndDate = course.EndDate
            };

            return Ok(courseViewModel);
        }
        [HttpGet("{courseId}/foruser")]
        public async Task<ActionResult<CourseViewModelDto>> GetCourseForNotRegisterUser(int courseId)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound($"Курс с ID {courseId} не найден.");
            }
            
            var courseViewModel = new CourseViewModelDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                Admins = course.Admins,
                PreviewPhotoKey = _s3.GetFileUrl(course.PreviewPhotoKey)
            };

            return Ok(courseViewModel);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<CourseViewModelDto>> CreateCourse(CourseCreateModelDto createModel)
        {

            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(ownerId))
            {
                return Unauthorized("Клейм ID пользователя не найден в JWT токене.");
            }

            var owner = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == ownerId);
            var course = new Course
            {
                Title = createModel.Title,
                Description = createModel.Description,
                EndDate = createModel.EndDate,
                OwnerId = ownerId,
                Owner = owner,
                Admins = new Dictionary<string, string>
                {
                    {$"{owner.UserName}", $"{owner.TelegramUsername}"}
                },
                CreateDate = DateTime.UtcNow,
                Lessons = new List<Lesson>(),
                Users = new List<User>(),
                CourseProgresses = new List<CourseProgress>()
            };
            var createdCourse = await _courseRepository.CreateCourseAsync(course);
            var filePath = $"courses/course{createdCourse.Id}/previewPhoto";
            var previewPhotoKey = await _s3.UploadFileAsync(createModel.PreviewPhoto, filePath);
            var endCourse = await _courseRepository.UpdatePreviewPhotoKeyAsync(previewPhotoKey, createdCourse);
            
            var courseViewModel = new CourseViewModelDto
            {
                Id = createdCourse.Id,
                Title = createdCourse.Title,
                Description = createdCourse.Description,
                OwnerId = createdCourse.OwnerId,
                Admins = createdCourse.Admins,
                PreviewPhotoKey = _s3.GetFileUrl(course.PreviewPhotoKey),
                CreateDate = createdCourse.CreateDate,
                EndDate = createdCourse.EndDate
            };

            return CreatedAtAction(nameof(CreateCourse), new { id = createdCourse.Id }, courseViewModel);
        }
        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Route("{courseId}/updateadmins")]
        public async Task<ActionResult<CourseViewModelDto>> UpdateCourseAdmins(int courseId, Dictionary<string, string> admins)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Курс не найден");
            }
            
            foreach (var admin in admins)
                course.Admins.Add($"{admin.Key}", $"{admin.Value}");

            await _courseRepository.UpdateCourseAsync(course);
            return Ok();
        }

        [HttpGet("mycourses")]
        public async Task<ActionResult<IEnumerable<CourseViewModelDto>>> GetMyCourses()
        {

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Клейм ID пользователя не найден в JWT токене.");
            }

            List<Course>? courses = new List<Course>();
            if (userRole == "Admin")
            {
                courses = await _courseRepository.GetOwnedCoursesByIdAsync(userId);
            }
            else
            {
                courses = await _courseRepository.GetUserCoursesByIdAsync(userId);
            }

            var courseViewModels = courses?.Select(c => new CourseViewModelDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                OwnerId = c.OwnerId, 
                Admins = c.Admins,
                PreviewPhotoKey = _s3.GetFileUrl(c.PreviewPhotoKey),
                CreateDate = c.CreateDate,
                EndDate = c.EndDate
            }).ToList();

            return Ok(courseViewModels);

        }
        
        
        [HttpPut("{courseId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCourse(int courseId, CourseUpdateModelDto updateModel)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound($"Курс с ID {courseId} не найден.");
            }


            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (course.OwnerId != currentUserId && !isAdmin)
            {
                return Forbid();
            }
            
            var filePath = $"courses/course{course.Id}/previewPhoto";
            var previewPhotoKey = updateModel.PreviewPhoto != null ? await _s3.UploadFileAsync(updateModel.PreviewPhoto, filePath) : "";
            course.Title = updateModel.Title;
            course.Description = updateModel.Description;
            course.PreviewPhotoKey =  previewPhotoKey;
            course.EndDate = updateModel.EndDate;

            try
            {
                await _courseRepository.UpdateCourseAsync(course);
            }
            catch (DbUpdateConcurrencyException)
            {
                var exists = await _courseRepository.GetCourseByIdAsync(courseId) != null;
                if (!exists)
                {
                    return NotFound($"Курс с ID {courseId} больше не существует.");
                }
                else
                {
                    return Conflict("Курс был изменен другим пользователем. Пожалуйста, обновите данные и попробуйте снова.");
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка при обновлении курса {courseId}: {ex.Message}");
                return Problem($"Произошла внутренняя ошибка при обновлении курса {courseId}.", statusCode: 500);
            }

            return NoContent();
        }

        [HttpDelete("{courseId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound($"Курс с ID {courseId} не найден.");
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (course.OwnerId != currentUserId && !isAdmin)
            {
                return Forbid();
            }
            bool deleted = await _courseRepository.DeleteCourseByIdAsync(courseId);

            if (!deleted)
            {
                return Problem($"Не удалось удалить курс с ID {courseId}. Возможно, он уже был удален или возникла ошибка.", statusCode: 500);
            }

            return NoContent();
        }

        [HttpPost("register")] 
        public async Task<IActionResult> RegisterToCourse(int courseId,string? telegranUsername)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound($"Курс с ID {courseId} не найден.");
            }
            var currentUserRole = User.FindFirstValue(ClaimTypes.Role);
            var user = new User();

            if (currentUserRole == "User")
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            }
            else if (currentUserRole == "Admin")
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.TelegramUsername == telegranUsername);
            
            if (user == null)
                return NotFound("User не найден");
            
            
            
            var courseProgress = new CourseProgress
            {
                User = user,
                UserId = user.Id,
                Course = course,
                CompletionPercentage = 0,
                CourseId = course.Id,
                LessonProgresses = new List<LessonProgress>()
            };

            
            var lessonProgresses = course.Lessons.Select(l => new LessonProgress
            {
                User = user,
                UserId = user.Id,
                CourseProgress = courseProgress,
                CourseProgressId = courseProgress.Id, 
                Lesson = l,
                LessonId = l.Id
            }).ToList();
            
            courseProgress.LessonProgresses = lessonProgresses;
            await _courseProgressRepository.CreateCourseProgressAsync(courseProgress);
            
            var updatedCourse = await _courseRepository.RegisterUserToCourseAsync(course, user, courseProgress);
            
            return Ok();
        }

         [HttpDelete("unregister")] 
         [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnregisterToCourse(int courseId, string? telegramUsername)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
                return NotFound($"Курс с ID {courseId} не найден.");
            
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.TelegramUsername == telegramUsername);
            if (user == null)
                return NotFound("User не найден");

            await _courseRepository.UnregisterUserToCourseAsync(course, user);
            return Ok();
        }
        [HttpGet("{courseId}/users")] 
        public async Task<IActionResult> GetCourseUsers(int courseId)
        {
            
            var users = await _courseRepository.GetEnrolledUsersAsync(courseId);

            
            var userViewModels = users.Select(c => new ViewModelDto()
            {
                Username = c.UserName,
                Id = c.Id
            }).ToList();
            

            return Ok(userViewModels);
        }

        [HttpGet("{courseId}/checkregister")]
        public async Task<bool> CheckRegisterToCourse(int courseId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var courses = await _courseRepository.GetUserCoursesByIdAsync(currentUserId);
            if (courses == null)
            {
                return false;
            }

            var user = courses.Find(u => u.Id == courseId);
            return user != null;
        }
        [HttpGet("{courseId}/checkadmin")]
        public async Task<bool> CheckOwnerOfCourse(int courseId)
        {
            var adminId= User.FindFirstValue(ClaimTypes.NameIdentifier);
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return false;
            }
            return course.OwnerId == adminId;
        }
    }
}