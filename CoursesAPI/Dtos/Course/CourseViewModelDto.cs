namespace CoursesAPI.Dtos.Course;
public class CourseViewModelDto
{
    public int Id { get; set; }
    public string Title { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public string OwnerId { get; set; } = String.Empty;
    public string PreviewPhotoKey { get; set; } = String.Empty;
    public Dictionary<string, string>? Admins { get; set; } 
    public DateTime CreateDate { get; set; }
    public DateTime EndDate { get; set; }
}