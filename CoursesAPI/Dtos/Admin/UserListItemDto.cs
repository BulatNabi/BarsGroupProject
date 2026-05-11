namespace CoursesAPI.Dtos.Admin;

public class UserListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? TelegramUsername { get; set; }
    public string Role { get; set; } = string.Empty;
    public int OwnedCoursesCount { get; set; }
    public int EnrolledCoursesCount { get; set; }
    public bool IsBlocked { get; set; }
}
