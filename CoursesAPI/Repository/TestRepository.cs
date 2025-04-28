using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;


public class TestRepository : ITestInterface
{
    private readonly ApplicationDbContext _context;
    public TestRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<Test>> CreateTestAsync(Lesson lesson, List<Test> test)
    {
        lesson.Tests.AddRange(test);
        await _context.Tests.AddRangeAsync(test);
        await _context.SaveChangesAsync();
        return test;
    }
    public async Task<Test> UpdateTestAsync(Test test)
    {
        var existingTest = await _context.Tests.FindAsync(test.Id);
        if (existingTest == null)
        {
            return null; 
        }

        _context.Entry(existingTest).CurrentValues.SetValues(existingTest);
        _context.Entry(existingTest).State = EntityState.Modified;

        await _context.SaveChangesAsync();
        return existingTest;

    }

    public async Task<List<Test>> GetAllTestsAsync()
    {
        return await _context.Tests.ToListAsync();
    }

    public async Task<Test?> GetTestByIdAsync(int testId)
    {
        return await _context.Tests.Where(x => x.Id == testId).FirstOrDefaultAsync();
    }
    
    public async Task<List<Test>?> GetAllTestsByLessonIdAsync(int lessonId)
    {
        var lesson = await _context.Lessons.Include(lesson => lesson.Tests)
            .FirstOrDefaultAsync(l =>  l.Id == lessonId);

        return lesson?.Tests.ToList();
    }
    public async Task<Test?> DeleteTestByIdAsync(int testId)
    {
        
        var deleteTest = await GetTestByIdAsync(testId);
        if (deleteTest == null) return null;
        

        _context.Tests.Remove(deleteTest);
        await _context.SaveChangesAsync();
        return deleteTest;
    }
}
