using System.Security.Claims;
using CoursesAPI.Models;
using CoursesAPI.Dtos.TestDto;
using CoursesAPI.Interfaces;
using CoursesAPI.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Controllers
{
    [ApiController]
    [Route($"api/tests")]
    [Authorize]
    public class TestController : ControllerBase
    {
        private readonly ITestInterface _testRepository;
        private readonly IllmService _llmService;
        private readonly ITestResultInterface _testResultRepository;
        private readonly ILessonInterface _lessonRepository;
        private readonly ILessonProgressInterface _lessonProgressRepository;

        public TestController(ITestInterface testRepository,
            ITestResultInterface testResultRepository,
            ILessonInterface lessonRepository,
            ILessonProgressInterface lessonProgressRepository, IllmService llmService)
        {
            _testRepository = testRepository;
            _testResultRepository = testResultRepository;
            _lessonRepository = lessonRepository;
            _lessonProgressRepository = lessonProgressRepository;
            _llmService = llmService;
        }
        
        
        [HttpGet("{id}")]
        public async Task<ActionResult<TestViewModelDto>> GetTest(int id)
        {
            var test = await _testRepository.GetTestByIdAsync(id);

            if (test == null)
            {
                return NotFound();
            }

            var testDto = new TestViewModelDto
            {
                Id = test.Id,
                Question = test.Question,
                Answers = test.Answers,
                CorrectAnswer = test.CorrectAnswer,
            };

            return Ok(testDto);
        }
        
        [HttpGet]
        [Route("getquiz")]
        public async Task<List<TestViewModelDto>> GetQuiz(string theme)
        {
            return await _llmService.GenerateQuizAsync(theme);
        }

        [HttpGet("lesson/{lessonId}")]
        public async Task<ActionResult<IEnumerable<TestViewModelDto>>> GetTestsByLesson(int lessonId)
        {
            var tests = await _testRepository.GetAllTestsByLessonIdAsync(lessonId);
            if (tests == null || tests.Count == 0)
            {
                return NotFound();
            }
            var testDtos = tests.Select(test => new TestViewModelDto
            {
                Id = test.Id,
                Question = test.Question,
                Answers = test.Answers,
                CorrectAnswer = test.CorrectAnswer,
            }).ToList();
            return Ok(testDtos);
        }

        
        [HttpPost("lesson/{lessonId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<TestViewModelDto>>> CreateTests(int lessonId, List<TestCreateModelDto> createTestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (createTestDto == null)
            {
                return BadRequest("TestCreateModelDto is null");
            }

            var lesson = await _lessonRepository.GetLessonByIdAsync(lessonId);
            if (lesson == null)
            {
                return NotFound("Lesson не найден");
            }
            var test = createTestDto.Select(t => new Test
            {
                LessonId = lessonId,
                Question = t.Question,
                Answers = t.Answers,
                CorrectAnswer = t.CorrectAnswer
            }).ToList();

            var createdTest = await _testRepository.CreateTestAsync(lesson, test);
            var createdTestDto = test.Select( l=>new TestViewModelDto
            {
                Id = l.Id,
                Question = l.Question,
                Answers = l.Answers,
                CorrectAnswer = l.CorrectAnswer,
            }).ToList();

            return CreatedAtAction(nameof(GetTest), new { id = 0 }, createdTestDto);
        }
        
        [HttpPut("lesson/{lessonId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTests(List<TestUpdateModelDto> updateTestsDtos)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            foreach (var test in updateTestsDtos)
            {


                var existingTest = await _testRepository.GetTestByIdAsync(test.Id);
                if (existingTest == null)
                {
                    return NotFound();
                }

                existingTest.Question = test.Question;
                existingTest.Answers = test.Answers;
                existingTest.CorrectAnswer = test.CorrectAnswer;

                try
                {
                    await _testRepository.UpdateTestAsync(existingTest);
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await TestExists(test.Id))
                        return NotFound();
                }
            }

            return NoContent();
        }

        private async Task<bool> TestExists(int id)
        {
            return await _testRepository.GetTestByIdAsync(id) != null;
        }

        [HttpDelete("{testId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TestViewModelDto>> DeleteTest(int testId)
        {
            var test = await _testRepository.DeleteTestByIdAsync(testId);
            if (test == null)
            {
                return NotFound();
            }

            var deletedTestDto = new TestViewModelDto
            {
                Id = test.Id,
                Question = test.Question,
                Answers = test.Answers,
                CorrectAnswer = test.CorrectAnswer,
            };

            return Ok(deletedTestDto);
        }

        [HttpPost("lesson/{lessonId}/submitresult")]
        public async Task<ActionResult> SubmitTestResult(int lessonId, int score, int testId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            
            var lessonProgress = await _lessonProgressRepository.GetLessonProgressByUserAndLessonIdAsync(userId, lessonId);
            if (lessonProgress == null)
            {
                return NotFound("Lesson ffprogress not found");
            }

            var testResult = new TestResult
            {
                UserId = userId,
                TestId = testId, 
                LessonProgressId = lessonProgress.Id,
                Score = score,
                SubmissionDate = DateTime.UtcNow
            };

            var createdResult = await _testResultRepository.AddTestResultAsync(testResult);
            await _lessonProgressRepository.AddTestResultToLessonProgressAsync(testResult, lessonProgress);
            
            var resultDto = new TestResult
            {
                Id = createdResult.Id,
                Score = createdResult.Score,
                TestId = createdResult.TestId,
                SubmissionDate = createdResult.SubmissionDate,
            };
            
            return Ok();
        }
    }
}