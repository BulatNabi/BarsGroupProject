namespace CoursesAPI.Dtos.Course;

public class CourseProgressForAdminDto
{
    
    public int? CoursesCount { get; set; } 
    public int? UsersCount { get; set; } 
    public double CompletionPercentage { get; set; }
    
}