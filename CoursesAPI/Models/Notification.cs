namespace CoursesAPI.Models;

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public string Type { get; set; } = string.Empty; // "block", "unblock", "feedback_reply", "system"
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public bool TelegramDelivered { get; set; }
}
