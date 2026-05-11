using CoursesAPI.Models;

namespace CoursesAPI.Interfaces;

public interface INotificationService
{
    Task<Notification> CreateAsync(string userId, string type, string title, string body);
}
