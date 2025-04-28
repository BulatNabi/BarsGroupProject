using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;

public class CourseRepository : ICourseInterface
{
    private readonly ApplicationDbContext _context;
    public CourseRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<Course> UpdatePreviewPhotoKeyAsync(string previewPhotoKey, Course course)
    {
        course.PreviewPhotoKey = previewPhotoKey;

        await _context.SaveChangesAsync();
        
        return course;
    }
    public async Task<List<Course>?> GetOwnedCoursesByIdAsync(string userId)
    {
        return  await _context.Courses
            .Where(u => u.OwnerId == userId)
            .Include(u => u.Users)
            .AsNoTracking() 
            .ToListAsync();

    }
    public async Task<List<Course>?> GetUserCoursesByIdAsync(string userId)
    {
        var user = await _context.Users
            .Include(u => u.Courses)
            .AsNoTracking() 
            .FirstOrDefaultAsync(u => u.Id == userId);
        return user?.Courses.ToList();
    }
    public async Task<Course> CreateCourseAsync(Course course)
    {
        
        await _context.Courses.AddAsync(course);
        await _context.SaveChangesAsync();
        return course;
    }
    
    public async Task<Course> RegisterUserToCourseAsync(Course course,User user, CourseProgress? courseProgress)
    {
        user?.Courses.Add(course);
        course.CourseProgresses.Add(courseProgress);
        course.Users?.Add(user);
        await _context.SaveChangesAsync();
        return course;
    }
    public async Task<Course> UnregisterUserToCourseAsync(Course course,User user)
    {
        var courseProgress = await _context.CourseProgresses
            .Where(c => c.CourseId == course.Id)
            .FirstOrDefaultAsync(u => u.UserId == user.Id);
        _context.CourseProgresses.Remove(courseProgress);
        user?.Courses.Remove(course);
        course.CourseProgresses.Remove(courseProgress);
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"DELETE FROM ""UserCourses"" 
            WHERE ""UsersId"" = {user.Id} AND ""CoursesId"" = {course.Id}"
        );
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<List<Course>?> GetAllCoursesAsync()
    {
        return await _context.Courses.AsNoTracking().ToListAsync();
    }
    
    public async Task<Course?> GetCourseByIdAsync(int courseId)
    {
        return await _context.Courses
            .Include(c => c.Lessons)
               .Where(x => x.Id == courseId)
               .FirstOrDefaultAsync();
    }
    public int GetCoursesCount()
    {
        return _context.Courses.Count();
    }

    public async Task<Course?> UpdateCourseAsync(Course course)
    {
        var existingCourse = await _context.Courses.FindAsync(course.Id);
        if (existingCourse == null)
        {
             return null;
        }

        _context.Entry(existingCourse).CurrentValues.SetValues(course);
        _context.Entry(existingCourse).State = EntityState.Modified;

        await _context.SaveChangesAsync();
        return existingCourse; 
        
    }
    
    public async Task<bool> DeleteCourseByIdAsync(int courseId)
    {
        var deleteCourse = await _context.Courses.FindAsync(courseId);

        if (deleteCourse == null) return false;

        _context.Courses.Remove(deleteCourse);
        var result = await _context.SaveChangesAsync();
        return result > 0; 
    }
    public async Task<bool> IsUserEnrolledAsync(int courseId, string userId)
    {
        
        return await _context.CourseProgresses
            .AnyAsync(cp => cp.CourseId == courseId && cp.UserId == userId);
    }
    public async Task<List<User>?> GetEnrolledUsersAsync(int courseId)
    {
        var course = await _context.Courses
            .AsNoTracking()
            .Include(c => c.Users)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        return course?.Users?.ToList();
    }
}