using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using CoursesAPI.Dtos.TestDto;
using CoursesAPI.Interfaces;

namespace CoursesAPI.Service;

public class LlmService : IllmService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _apiUrl;
    private readonly string? _httpReferer;
    private readonly string? _appTitle;

    public LlmService(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _apiKey = configuration["OpenRouter:ApiKey"] ?? string.Empty;
        _model = configuration["OpenRouter:Model"] ?? "openai/gpt-4o-mini";
        _apiUrl = configuration["OpenRouter:ApiUrl"] ?? "https://openrouter.ai/api/v1/chat/completions";
        _httpReferer = configuration["OpenRouter:HttpReferer"];
        _appTitle = configuration["OpenRouter:AppTitle"];

        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        if (!string.IsNullOrEmpty(_httpReferer))
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", _httpReferer);
        if (!string.IsNullOrEmpty(_appTitle))
            _httpClient.DefaultRequestHeaders.Add("X-Title", _appTitle);
    }

    public async Task<List<TestViewModelDto>> GenerateQuizAsync(string topic, int numQuestions = 5)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return new List<TestViewModelDto>();

        var requestData = new
        {
            model = _model,
            temperature = 0.7,
            max_tokens = 2000,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You are a helpful assistant that creates multiple-choice quizzes in a specified JSON format. Output ONLY valid JSON, no prose, no markdown fences."
                },
                new { role = "user", content = BuildUserPrompt(topic, numQuestions) }
            }
        };

        var content = new StringContent(
            JsonConvert.SerializeObject(requestData),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.PostAsync(_apiUrl, content);
        var responseString = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return new List<TestViewModelDto>();

        var jsonResponse = JObject.Parse(responseString);
        var generatedText = jsonResponse["choices"]?[0]?["message"]?["content"]?.ToString();
        if (string.IsNullOrEmpty(generatedText))
            return new List<TestViewModelDto>();

        var cleanedText = StripCodeFences(generatedText.Trim());

        try
        {
            var quizJsonWrapper = JObject.Parse(cleanedText);
            var quizArray = quizJsonWrapper["quiz"] as JArray;
            var quizDataList = quizArray?.ToObject<List<TestViewModelDto>>();
            if (quizDataList != null)
            {
                for (int i = 0; i < quizDataList.Count; i++)
                    quizDataList[i].Id = i;
                return quizDataList;
            }
        }
        catch (JsonException)
        {
            return new List<TestViewModelDto>();
        }

        return new List<TestViewModelDto>();
    }

    private static string StripCodeFences(string text)
    {
        if (!text.StartsWith("```")) return text;
        var firstNewline = text.IndexOf('\n');
        if (firstNewline == -1) return text;
        var inner = text[(firstNewline + 1)..];
        var lastFence = inner.LastIndexOf("```", StringComparison.Ordinal);
        return lastFence == -1 ? inner.Trim() : inner[..lastFence].Trim();
    }

    private string BuildUserPrompt(string topic, int numQuestions)
    {
        return $"Generate a quiz with exactly {numQuestions} multiple-choice questions about the topic: '{topic}'. \nEach question must have exactly 4 answer options.\nPresent the quiz as a JSON object containing a single key 'quiz', whose value is a list of question objects.\nEach question object must have the following keys (use PascalCase): 'Question' (string), 'Answers' (array of 4 strings), 'CorrectAnswer' (string, the text of the correct answer from the 'Answers' array).\nThe JSON structure should be exactly like this example (with keys in PascalCase):\n{{\n  \"quiz\": [\n    {{\n      \"Question\": \"текст вопроса 1\",\n      \"Answers\": [\"вариант A\", \"вариант B\", \"вариант C\", \"вариант D\"],\n      \"CorrectAnswer\": \"текст правильного варианта\"\n    }}\n  ]\n}}\nMake sure the output is ONLY the valid JSON object and nothing else.";
    }
}
