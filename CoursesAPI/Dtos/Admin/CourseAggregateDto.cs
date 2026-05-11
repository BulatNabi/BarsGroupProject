namespace CoursesAPI.Dtos.Admin;

public class CourseAggregateDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? PreviewPhotoUrl { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string? OwnerUsername { get; set; }
    public DateTime CreateDate { get; set; }
    public DateTime EndDate { get; set; }
    public int LessonsCount { get; set; }
    public int EnrolledUsersCount { get; set; }
    public double AverageCompletion { get; set; }
}
