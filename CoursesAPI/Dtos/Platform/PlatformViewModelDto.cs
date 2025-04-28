using CoursesAPI.Dtos.Course;
using CoursesAPI.Dtos.User;

namespace CoursesAPI.Dtos.Platform;

public class PlatformViewModelDto
{
    public int AllUsersCount { get; set; }
    public int AllCoursesCount { get; set; }
    public int AllCompletedCoursesCount { get; set; }
    public Dictionary<string, double>? ThreeCourses { get; set; }
    public List<string> BestUsers { get; set; } = new List<string>();
    public List<string> Courses { get; set; } = new List<string>();
}