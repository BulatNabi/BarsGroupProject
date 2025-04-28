namespace CoursesAPI.Models;

public class LessonProgress
{
    public int Id { get; set; }
    public User User { get; set; }
    public Lesson Lesson { get; set; }
    public CourseProgress? CourseProgress { get; set; }
    public int Score { get; set; } = 0;
    public bool IsCompleted { get; set; } = false;
    public List<TestResult> TestResults { get; set; } = new List<TestResult>();
    public int LessonId { get; set; }
    public string? UserId { get; set; }
    public int CourseProgressId { get; set; }
}