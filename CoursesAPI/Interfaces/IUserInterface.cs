using CoursesAPI.Models;

namespace CoursesAPI.Interfaces;

public interface IUserInterface
{
    Task<string> UpdateUserPhotoAsync(User user, string photoKey);
}

    
