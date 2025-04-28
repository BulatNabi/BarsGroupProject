namespace CoursesAPI.Models;

public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public User Owner { get; set; } = new User();
    public string OwnerId { get; set; } = string.Empty;
    public string PreviewPhotoKey { get; set; } = String.Empty;
    public Dictionary<string, string>? Admins { get; set; } 
    public List<Lesson>? Lessons { get; set; } 
    public List<User>? Users { get; set; } 
    public DateTime CreateDate { get; set; } = DateTime.Now;
    public DateTime EndDate { get; set; }
    public List<CourseProgress?>? CourseProgresses { get; set; } 
    
}