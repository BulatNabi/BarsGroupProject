namespace CoursesAPI.Dtos.Admin;

public class TeacherListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? TelegramUsername { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public int OwnedCoursesCount { get; set; }
    public int TotalStudents { get; set; }
    public double AverageStudentCompletion { get; set; }
}
