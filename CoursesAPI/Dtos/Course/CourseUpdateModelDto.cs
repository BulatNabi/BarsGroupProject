namespace CoursesAPI.Dtos.Course;
public class CourseUpdateModelDto
{
    public string Title { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    
    public IFormFile? PreviewPhoto { get; set; }
    public DateTime EndDate { get; set; }
    
}