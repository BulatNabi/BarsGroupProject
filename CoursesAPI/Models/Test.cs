namespace CoursesAPI.Models;
public class Test
{

    public int Id { get; set; }
    public Lesson Lesson { get; set; }
    public int LessonId { get; set; }
    public string Question { get; set; } = String.Empty;
    public List<String> Answers { get; set; } = new List<string>();
    public string CorrectAnswer { get; set; } = String.Empty;
    public List<TestResult> TestResults { get; set; } = new List<TestResult>();
}