namespace CoursesAPI.Models;

public class CourseProgress
{
    public int Id { get; set; }
    public User User { get; set; }
    public string UserId { get; set; }
    public Course Course { get; set; }

    public DateTime? StartDate { get; set; }
    public double CompletionPercentage { get; set; }
    public List<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
    public int CourseId { get; set; }
}