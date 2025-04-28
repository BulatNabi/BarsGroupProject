using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;

public class CourseProgressRepository : ICourseProgressInterface
{
    private readonly ApplicationDbContext _context;

    public CourseProgressRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CourseProgress?> GetCourseProgressByCourseAndUserIdAsync(int courseId, string userId)
    {
        return await _context.CourseProgresses
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Include(u => u.LessonProgresses)
            .FirstOrDefaultAsync(c => c.CourseId == courseId);
    }

    public async Task<List<CourseProgress>?> GetCourseProgressByUserIdAsync(string userId)
    {
        return await _context.CourseProgresses
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Include(u => u.LessonProgresses)
            .Include(u => u.Course)
            .ToListAsync();
    }
    public Task<List<CourseProgress>> GetCourseProgressesAsync()
    {
        return  _context.CourseProgresses
            .Include(u => u.User)
            .Include(u => u.Course)
            .ToListAsync();
    }

    

    public async Task<CourseProgress?> UpdateLessonProgressAsync(CourseProgress courseProgress,
        List<LessonProgress> lessonProgresses)
    {
        courseProgress.LessonProgresses = lessonProgresses;
        foreach (var lessonProgress in lessonProgresses)
        {
            await _context.LessonProgresses.AddAsync(lessonProgress);
        }
        await _context.SaveChangesAsync();
        return courseProgress;
    }

    public async Task<List<CourseProgress>> GetCourseProgressByCourseIdAsync(int courseId)
    {
        
        return await _context.CourseProgresses
            .Include(cp => cp.User)
            .Include(cp => cp.LessonProgresses) 
            .ThenInclude(lp => lp.Lesson)
            .ThenInclude(lesson => lesson.Tests) 
            .Where(cp => cp.CourseId == courseId)
            .ToListAsync();
    }
    
    public async Task<CourseProgress?> CreateCourseProgressAsync(CourseProgress? courseProgress)
    {
        
        _context.CourseProgresses.Add(courseProgress);
        await _context.SaveChangesAsync();
        return courseProgress;
    }
    

    public async Task<CourseProgress> DeleteCourseProgressAsync(int courseProgressId)
    {
        var deleteCourseProgress = await _context.CourseProgresses.FirstOrDefaultAsync(cp => cp.Id == courseProgressId);

        if (deleteCourseProgress == null) return null;

        _context.CourseProgresses.Remove(deleteCourseProgress);
        await _context.SaveChangesAsync();
        return deleteCourseProgress;
    }

    public async Task<bool> ExistsAsync(int courseProgressId)
    {
        return await _context.CourseProgresses.AnyAsync(cp => cp.Id == courseProgressId);
    }
}
