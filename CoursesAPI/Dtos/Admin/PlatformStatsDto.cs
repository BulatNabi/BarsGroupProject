namespace CoursesAPI.Dtos.Admin;

public class PlatformStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalAdmins { get; set; }
    public int TotalCourses { get; set; }
    public int TotalLessons { get; set; }
    public int TotalTests { get; set; }
    public int ActiveEnrollments { get; set; }
    public double AverageCompletion { get; set; }
    public int CompletedCourses { get; set; }
    public List<TopCourseDto> TopCourses { get; set; } = new();
    public List<TopTeacherDto> TopTeachers { get; set; } = new();
}

public class TopCourseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Enrollments { get; set; }
    public double AverageCompletion { get; set; }
}

public class TopTeacherDto
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public int CoursesCount { get; set; }
    public int StudentsCount { get; set; }
}
