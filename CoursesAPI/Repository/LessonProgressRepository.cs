using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;

public class LessonProgressRepository : ILessonProgressInterface
{
    private readonly ApplicationDbContext _context;
    public LessonProgressRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<LessonProgress?> GetLessonProgressByIdAsync(int id)
    {
        return await _context.LessonProgresses
            .Include(c => c.CourseProgress)
            .FirstOrDefaultAsync(lp => lp.Id == id);
    }
    

    public async Task<LessonProgress> CreateLessonProgressAsync(LessonProgress lessonProgress)
    {
        
        await _context.LessonProgresses.AddAsync(lessonProgress);
        await _context.SaveChangesAsync();
        return lessonProgress;
    }
    
    public async Task<LessonProgress?> DeleteLessonProgressAsync(int id)
    {
        var lessonProgressToDelete = await _context.LessonProgresses.FindAsync(id);
        if (lessonProgressToDelete == null) return null;
        
        _context.LessonProgresses.Remove(lessonProgressToDelete);
        await _context.SaveChangesAsync();
        return lessonProgressToDelete;
    }
    
    public async Task<LessonProgress?> AddTestResultToLessonProgressAsync(TestResult testResult, LessonProgress lessonProgress)
    {
        testResult.LessonProgress = lessonProgress;
        testResult.LessonProgressId = lessonProgress.Id;
        
        lessonProgress.TestResults.Add(testResult);

        var lesson = await _context.Lessons
            .AsNoTracking()
            .Include(l => l.Tests)
            .Include(l => l.LessonProgresses)
            .FirstOrDefaultAsync(x => x.Id == lessonProgress.LessonId);
        var courseProgress = await _context.CourseProgresses
            .Include(c => c.LessonProgresses).FirstOrDefaultAsync(c => c.Id == lessonProgress.CourseProgressId);
        if (lesson != null && lesson.Tests.Any())
        {
            double testsCount = lesson.Tests.Count;
            double correctTests = testResult.Score;
            if (correctTests > lessonProgress.Score)
                lessonProgress.Score = Convert.ToInt32(correctTests);
            
            if (lessonProgress.Score / testsCount > 0.7f)
            {
                lessonProgress.IsCompleted = true;
            }
        }
        await _context.SaveChangesAsync();
        
        if (courseProgress != null)
        {
            double all = courseProgress.LessonProgresses.Count;
            double completed = courseProgress.LessonProgresses.Count(lp => lp.IsCompleted);

            courseProgress.CompletionPercentage = all != 0 ? completed*100 / all : 0;
            lessonProgress.CourseProgress.CompletionPercentage =  all != 0 ? completed*100 / all : 0;
        }
        await _context.SaveChangesAsync();
        return lessonProgress;
    }
    public async Task<LessonProgress> UpdateLessonProgressForNewLessonsAsync(LessonProgress lessonProgress, CourseProgress courseProgress)
    {
        if (_context.Entry(courseProgress).State == EntityState.Detached)
        {
            _context.CourseProgresses.Attach(courseProgress);
            _context.Entry(courseProgress).State = EntityState.Unchanged;
        }

        var user = await _context.Users
            .Include(u => u.LessonProgresses)
            .FirstOrDefaultAsync(u => u.Id == lessonProgress.UserId);

        await _context.LessonProgresses.AddAsync(lessonProgress);
        await _context.SaveChangesAsync();
        return lessonProgress;
    }

    public async Task<LessonProgress?> GetLessonProgressByUserAndLessonIdAsync(string userId, int lessonId)
    {
        return await _context.LessonProgresses.Where(lp => lp.UserId == userId)
            .FirstOrDefaultAsync(lp =>  lp.LessonId == lessonId);
    }
}