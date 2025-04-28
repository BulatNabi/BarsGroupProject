using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;
public class TestResultRepository : ITestResultInterface
{
    private readonly ApplicationDbContext _context;

    public TestResultRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TestResult?> GetByIdAsync(int id)
    {
        return await _context.TestResults.FindAsync(id);
    }

    public async Task<TestResult> AddTestResultAsync(TestResult testResult)
    {
        await _context.TestResults.AddAsync(testResult);
        await _context.SaveChangesAsync();
        return testResult;
    }
}