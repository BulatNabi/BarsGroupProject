using CoursesAPI.Models;
namespace CoursesAPI.Interfaces;

public interface ICourseInterface
{
    Task<Course> CreateCourseAsync(Course course);
    Task<List<Course>?> GetAllCoursesAsync();
    Task<Course?> GetCourseByIdAsync(int courseId);
    Task<Course?> UpdateCourseAsync(Course course); 
    Task<bool> DeleteCourseByIdAsync(int courseId); 
    Task<bool> IsUserEnrolledAsync(int courseId, string userId);
    Task<List<Course>?> GetOwnedCoursesByIdAsync(string userId);
    Task<Course> RegisterUserToCourseAsync(Course course, User user, CourseProgress? courseProgress);
    Task<List<User>?> GetEnrolledUsersAsync(int courseId);
    Task<Course> UnregisterUserToCourseAsync(Course course, User user);
    Task<Course> UpdatePreviewPhotoKeyAsync(string previewPhotoKey, Course course);
    Task<List<Course>?> GetUserCoursesByIdAsync(string userId);
    int GetCoursesCount();
}