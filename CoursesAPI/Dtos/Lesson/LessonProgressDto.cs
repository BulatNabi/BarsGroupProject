namespace CoursesAPI.Dtos.Lesson;

public class LessonProgressDto
{
    public string? LessonName { get; set; } 
    public int LessonId { get; set; }
    public bool IsCompleted { get; set; } 
    public string? TestScore { get; set; }
}