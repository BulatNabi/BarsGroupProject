using CoursesAPI.Models;
namespace CoursesAPI.Interfaces;

public interface ITokenService
{
    Task<string> CreateToken(User user);
}