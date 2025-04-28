namespace CoursesAPI.Models;
public class TestResult
{
    public int Id { get; set; }
    public User User { get; set; }
    public Test Test { get; set; }
    public LessonProgress LessonProgress { get; set; } 
    public DateTime SubmissionDate { get; set; } = DateTime.Now;
    public int Score { get; set; } 
    public int LessonProgressId { get; set; }
    public int TestId { get; set; }
    public string UserId { get; set; }
}