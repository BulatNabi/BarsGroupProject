using CoursesAPI.Models;
namespace CoursesAPI.Interfaces
{
    public interface ITestResultInterface
    {
        Task<TestResult?> GetByIdAsync(int id);
        Task<TestResult> AddTestResultAsync(TestResult testResult);
    }
}