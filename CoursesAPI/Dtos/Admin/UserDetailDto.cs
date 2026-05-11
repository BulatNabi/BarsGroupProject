namespace CoursesAPI.Dtos.Admin;

public class UserDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? TelegramUsername { get; set; }
    public int? TelegramUserId { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime BirthdayDate { get; set; }
    public List<AdminCourseSummaryDto> OwnedCourses { get; set; } = new();
    public List<AdminCourseSummaryDto> EnrolledCourses { get; set; } = new();
    public double AverageCompletion { get; set; }
    public bool IsBlocked { get; set; }
    public DateTimeOffset? BlockedUntil { get; set; }
}

public class AdminCourseSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public double? CompletionPercentage { get; set; }
}
