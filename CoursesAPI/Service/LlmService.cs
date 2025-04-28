using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using CoursesAPI.Dtos.TestDto;
using CoursesAPI.Interfaces; 

namespace CoursesAPI.Service;
public class LlmService : IllmService
{ 
    private readonly string _folderId;
    private readonly string _iamToken;
    private readonly HttpClient _httpClient;
    private readonly string _yandexGptApiUrl; 

        
    public LlmService(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _folderId = configuration["ConnectionStrings:Folder"];
        _iamToken = configuration["ConnectionStrings:YandexApi"];
        _yandexGptApiUrl = configuration["ConnectionStrings:YandexApiUrl"];
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _iamToken);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }


    public async Task<List<TestViewModelDto>> GenerateQuizAsync(string topic, int numQuestions = 5)
    {
        var requestData = new
        {
            modelUri = $"gpt://{_folderId}/yandexgpt-lite",
            completionOptions = new
            {
                stream = false,
                temperature = 0.7,
                maxTokens = "2000", 
                reasoningOptions = new { mode = "DISABLED" }
            },
            messages = new[]
            {
                new
                {
                    role = "system",
                    text = "You are a helpful assistant that creates multiple-choice quizzes in a specified JSON format."
                },
                new { role = "user", text = BuildUserPrompt(topic, numQuestions) }
            }
        };
            
        var content = new StringContent(
            JsonConvert.SerializeObject(requestData),
            Encoding.UTF8,
            "application/json");
            
        var response = await _httpClient.PostAsync(
            _yandexGptApiUrl,
            content);

        var responseString = await response.Content.ReadAsStringAsync();
            
        if (response.IsSuccessStatusCode)
        {
            JObject jsonResponse = JObject.Parse(responseString);
            string? generatedText = jsonResponse["result"]?["alternatives"]?[0]?["message"]?["text"]?.ToString();

            if (!string.IsNullOrEmpty(generatedText))
            {
                string cleanedText = generatedText.Trim();
                if (cleanedText.StartsWith("```"))
                {
                    int fenceStart = cleanedText.IndexOf('\n');
                    if (fenceStart != -1)
                    {
                        int fenceEnd = cleanedText.LastIndexOf("```");
                        cleanedText = cleanedText.Substring(fenceStart + 1, fenceEnd - (fenceStart + 1))
                            .Trim();
                    }
                    else
                    {
                        int firstLineEnd = cleanedText.IndexOf('\n');
                        if (firstLineEnd == -1) firstLineEnd = cleanedText.Length;
                        int langIdEnd =
                            cleanedText.IndexOfAny(new[] { ' ', '\n' },
                                3);
                        if (langIdEnd == -1 || langIdEnd > firstLineEnd)
                            langIdEnd = firstLineEnd;

                        cleanedText = cleanedText.Substring(langIdEnd).TrimStart();
                        int potentialEnd = cleanedText.LastIndexOf("```");
                        if (potentialEnd != -1)
                        {
                            cleanedText = cleanedText.Substring(0, potentialEnd).TrimEnd();
                        }
                    }
                }
                JObject quizJsonWrapper = JObject.Parse(cleanedText);
                JArray? quizArray = quizJsonWrapper["quiz"] as JArray;

                List<TestViewModelDto>? quizDataList = quizArray.ToObject<List<TestViewModelDto>>();
                if (quizDataList != null)
                {
                    for(int i = 0; i < quizDataList.Count; i++)
                        quizDataList[i].Id = i;
                    return quizDataList;
                }
            }
        }

        return new List<TestViewModelDto>();
    }


    private string BuildUserPrompt(string topic, int numQuestions)
    {
        return $"Generate a quiz with exactly {numQuestions} multiple-choice questions about the topic: '{topic}'. \nEach question must have exactly 4 answer options.\nPresent the quiz as a JSON object containing a single key 'quiz', whose value is a list of question objects.\nEach question object must have the following keys (use PascalCase): 'Question' (string), 'Answers' (array of 4 strings), 'CorrectAnswer' (string, the text of the correct answer from the 'Answers' array).\nThe JSON structure should be exactly like this example (with keys in PascalCase):\n{{\n  \"quiz\": [\n    {{\n      \"Question\": \"текст вопроса 1\",\n      \"Answers\": [\"вариант A\", \"вариант B\", \"вариант C\", \"вариант D\"],\n      \"CorrectAnswer\": \"текст правильного варианта\"\n    }},\n    // ... {numQuestions - 1} других вопросов ...\n  ]\n}}\nMake sure the output is ONLY the valid JSON object and nothing else.";
    }
}
