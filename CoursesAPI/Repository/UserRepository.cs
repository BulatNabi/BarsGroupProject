using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;

namespace CoursesAPI.Repository;

public class UserRepository : IUserInterface
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> UpdateUserPhotoAsync(User user, string photoKey)
    {
        user.ProfilePhotoKey = photoKey;
        await _context.SaveChangesAsync();
        return photoKey;
    }
}