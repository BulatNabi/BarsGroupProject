namespace CoursesAPI.Dtos.TestDto;

public class TestUpdateModelDto
{
    public int Id { get; set; }
    public string Question { get; set; } = String.Empty;
    public List<String> Answers { get; set; } = new List<string>();
    public string CorrectAnswer { get; set; } = String.Empty;
}