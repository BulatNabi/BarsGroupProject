using CoursesAPI.Dtos.TestDto;
namespace CoursesAPI.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;

public interface IllmService
{
        Task<List<TestViewModelDto>> GenerateQuizAsync(string topic, int numQuestions = 5);
}

