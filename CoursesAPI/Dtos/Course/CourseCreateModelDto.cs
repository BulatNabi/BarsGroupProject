namespace CoursesAPI.Dtos.Course;

public class CourseCreateModelDto
{
    public string Title { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public IFormFile? PreviewPhoto { get; set; }
    public DateTime EndDate { get; set; }
    
}

