using CoursesAPI.Dtos.Course;
using CoursesAPI.Models;

namespace CoursesAPI.Dtos.User;

public class InfoModelDto
{
    public string? Username { get; set; }
    public string? Telegramusername { get; set; }
    public string? ProfilePhotoKey { get; set; }
    public int? EndedCourses { get; set; }
    public CourseProgressDto? BestCourse { get; set; }
    public List<CourseProgressDto>? CourseProgresses { get; set; }
}