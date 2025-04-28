namespace CoursesAPI.Dtos.Lesson;

public class LessonUpdateModelDto
{
    public string? Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<IFormFile>? Videos { get; set; }
    public List<IFormFile>? Lectures { get; set; } 
    public List<IFormFile>? Photos { get; set; } 
    public List<IFormFile>? Books { get; set; }
    public List<IFormFile>? Audios { get; set; }
    
    public List<string>? TextLectures { get; set; }
    public List<string>? VideosKeys { get; set; }
    public List<string>? LecturesKeys { get; set; } 
    public List<string>? PhotosKeys { get; set; } 
    public List<string>? BooksKeys { get; set; }
    public List<string>? AudiosKeys { get; set; }
}