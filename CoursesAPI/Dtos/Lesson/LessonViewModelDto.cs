using CoursesAPI.Dtos.TestDto;
using CoursesAPI.Models;
namespace CoursesAPI.Dtos.Lesson;

public class LessonViewModelDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string? Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreateDate { get; set; }
    public List<string> VideoKeys { get; set; } = new List<string>();
    public List<string> LectureKeys { get; set; } = new List<string>();
    public List<string> PhotoKeys { get; set; } = new List<string>();
    public List<string> BooksKeys { get; set; } = new List<string>();
    public List<string> AudioKeys { get; set; } = new List<string>();
    public List<string>? TextLectures { get; set; }= new List<string>();
    public List<TestViewModelDto> Tests { get; set; } = new List<TestViewModelDto>();
    public List<TestResult> TestResults { get; set; } = new List<TestResult>();
}

    