using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;
using CoursesAPI.Dtos.Course;
using CoursesAPI.Dtos.Telegram;
using CoursesAPI.Models;
using CoursesAPI.Dtos.User;
using CoursesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly ICourseProgressInterface _courseProgressRepository;
    private readonly IS3Interface _s3;
    private readonly IUserInterface _userRepository;
    public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, ITokenService tokenService, IConfiguration configuration, ICourseProgressInterface courseProgressRepository, IS3Interface s3, IUserInterface userRepository)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _configuration = configuration;
        _courseProgressRepository = courseProgressRepository;
        _s3 = s3;
        _userRepository = userRepository;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
    
        var user = await _userManager.Users.FirstOrDefaultAsync(x=> x.Email == loginDto.Email);

        if (user == null) return Unauthorized("User not found");

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

        if (!result.Succeeded) return Unauthorized("Password is not correct");

        return Ok(
            new NewUserDto
            {
                Username = user.UserName,
                Email = user.Email, 
                Token = await _tokenService.CreateToken(user)
            });
    }


    [HttpPost("register")]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
    
        try
        {
            var user = new User
            {
                Email = registerDto.Email,
                UserName = registerDto.Username,
                TelegramUsername = registerDto.TelegramUsername
            };

            var createUser = await _userManager.CreateAsync(user, registerDto.Password);

            if (!createUser.Succeeded)
                return BadRequest(createUser.Errors.Select(e => e.Description));

            var roleResult = await _userManager.AddToRoleAsync(user, "Admin");
        
            if (!roleResult.Succeeded)
                return BadRequest(roleResult.Errors.Select(e => e.Description));

            return Ok(new NewUserDto
            {
                Username = user.UserName,
                Email = user.Email,
                Token = await _tokenService.CreateToken(user)
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new { Error = e.Message });
        }
    }
    
    [HttpPost("telegramAuth")]
    public async Task<IActionResult> LoginWithTelegram([FromBody] string initData)
    {
        if (string.IsNullOrEmpty(initData))
        {
            return BadRequest("InitData is required.");
        }

        var botToken = _configuration["ConnectionStrings:BotToken"];
        if (string.IsNullOrEmpty(botToken))
        {
            return StatusCode(500, "Server configuration error.");
        }

        bool verified = false;
        try
        {
            verified = VerifyTelegramInitData(initData, botToken);
        }
        catch 
        {
            return StatusCode(500, "Error verifying InitData.");
        }

        if (!verified)
        {
            return Unauthorized("Invalid InitData signature.");
        }

        var queryParams = HttpUtility.ParseQueryString(initData);
        
        var userDataJson = queryParams["user"];
        if (string.IsNullOrEmpty(userDataJson))
        {
            userDataJson = queryParams["receiver"];
            if (string.IsNullOrEmpty(userDataJson))
            {
                return BadRequest("User data missing in InitData.");
            }
        }

        TelegramUserDto? telegramUser = null;
        try
        {
            telegramUser = JsonSerializer.Deserialize<TelegramUserDto>(userDataJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (telegramUser == null || telegramUser.Id == 0)
            {
                return BadRequest("Invalid user data structure in InitData.");
            }
            
        }
        catch (JsonException) 
        {
            return BadRequest("Failed to parse user data from InitData.");
        }
        catch 
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Error processing user data.");
        }

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.TelegramUserId == telegramUser.Id);

        if (user == null)
        {
            user = new User
            {
                TelegramUserId = telegramUser.Id,
                UserName = telegramUser.Username ?? $"tg_{telegramUser.Id}",
                FirstName = telegramUser.First_name,
                LastName = telegramUser.Last_name,
                TelegramUsername = telegramUser.Username,
                Email = $"telegram_{telegramUser.Id}@placeholder.com",
                EmailConfirmed = true,
                BirthdayDate = DateTime.MinValue
            };

            var result = await _userManager.CreateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));
            
            var roleResult = await _userManager.AddToRoleAsync(user, "User");
        
            if (!roleResult.Succeeded)
                return BadRequest(roleResult.Errors.Select(e => e.Description));
        }
        else
        {
            bool profileUpdated = false;
            if (user.FirstName != telegramUser.First_name) { user.FirstName = telegramUser.First_name; profileUpdated = true; }
            if (user.LastName != telegramUser.Last_name) { user.LastName = telegramUser.Last_name; profileUpdated = true; }
            if (user.TelegramUsername != telegramUser.Username) { user.TelegramUsername = telegramUser.Username; profileUpdated = true; }
            if(profileUpdated)
            {
                var updateResult = await _userManager.UpdateAsync(user);
            }
        }
        
        var jwtToken = await _tokenService.CreateToken(user);

        return Ok(new NewUserDto
        {
            Username = user.TelegramUsername,
            Token = jwtToken,
            Email = user.Email
        });
    }
    
    private bool VerifyTelegramInitData(string initData, string botToken)
    {
        var hashIndex = initData.IndexOf("hash=");
        if (hashIndex == -1)
            return false;
        

        var hash = initData.Substring(hashIndex + 5);
        var dataCheckString = initData.Remove(hashIndex - 1);

        var pairs = dataCheckString.Split('&');
        Array.Sort(pairs);

        var sortedDataCheckString = string.Join("\n", pairs.Select(p => {
            var parts = p.Split('=');
            if(parts.Length == 2)
            {
                return $"{parts[0]}={Uri.UnescapeDataString(parts[1])}";
            }
            return p;
        }));

        using var hmacsha256 = new HMACSHA256(Encoding.ASCII.GetBytes("WebAppData"));
        var secretKey = hmacsha256.ComputeHash(Encoding.UTF8.GetBytes(botToken));

        using var hmacsha256Data = new HMACSHA256(secretKey);
        var calculatedHashBytes = hmacsha256Data.ComputeHash(Encoding.UTF8.GetBytes(sortedDataCheckString));
        var calculatedHash = BitConverter.ToString(calculatedHashBytes).Replace("-", "").ToLower();

        return string.Equals(calculatedHash, hash, StringComparison.OrdinalIgnoreCase);
    }
    [HttpGet]
    [Authorize]
    [Route("userinfo")]
    public async Task<ActionResult<InfoModelDto>> GetUserProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var courseProgresses = await _courseProgressRepository.GetCourseProgressByUserIdAsync(userId);
        if (courseProgresses == null)
        {
            return NotFound($"Прогресс не найден");
        }
        var userCourseProgresses = courseProgresses.Select(cp => new CourseProgressDto {CourseName = cp.Course.Title, CompletionPercentage = cp.CompletionPercentage, }).OrderByDescending(u => u.CompletionPercentage).ToList();
        var bestCourse = userCourseProgresses.FirstOrDefault();
        return new InfoModelDto
        {
            Username = user.UserName,
            ProfilePhotoKey = user.ProfilePhotoKey != null ? _s3.GetFileUrl(user.ProfilePhotoKey) : "",
            Telegramusername = user.TelegramUsername,
            BestCourse = bestCourse,
            EndedCourses = userCourseProgresses.Where(u => u.CompletionPercentage > 0.9f).ToList().Count,
            CourseProgresses = userCourseProgresses
        };
    }
    [HttpPost]
    [Authorize]
    [Route("loadprofilephoto")]
    public async Task<string> LoadProfilePhoto(LoadProfilePhotoDto loadProfilePhotoDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var filePath = $"profilePhotos/{user.UserName}";
        var profilePhotoKey = await _s3.UploadFileAsync(loadProfilePhotoDto.ProfilePhoto, filePath);
        await _userRepository.UpdateUserPhotoAsync(user, profilePhotoKey);
        return _s3.GetFileUrl(profilePhotoKey);
    }
}