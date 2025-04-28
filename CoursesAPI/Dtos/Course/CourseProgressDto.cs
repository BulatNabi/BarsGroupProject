using CoursesAPI.Dtos.Lesson;
using CoursesAPI.Models;

namespace CoursesAPI.Dtos.Course;

public class CourseProgressDto
{
    public string? Username { get; set; }
    public string? CourseName { get; set; } 
    public double CompletionPercentage { get; set; }
    public List<LessonProgressDto> LessonProgresses { get; set; } = new List<LessonProgressDto>();
}