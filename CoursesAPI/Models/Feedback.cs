namespace CoursesAPI.Models;

public class Feedback
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string Status { get; set; } = "Open"; // Open | Replied | Closed
    public string? AdminReply { get; set; }
    public string? RepliedByUserId { get; set; }
    public DateTime? RepliedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
