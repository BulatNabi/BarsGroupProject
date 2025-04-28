using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using CoursesAPI.Repository;
using CoursesAPI.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);
const string allowReactAppPolicy = "_allowReactAppPolicy";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IllmService, LlmService>();
builder.Services.AddScoped<IUserInterface, UserRepository>();
builder.Services.AddScoped<IS3Interface, S3Service>();
builder.Services.AddScoped<ICourseInterface, CourseRepository>();
builder.Services.AddScoped<ICourseProgressInterface, CourseProgressRepository>();
builder.Services.AddScoped<ILessonInterface, LessonRepository>();
builder.Services.AddScoped<ILessonProgressInterface, LessonProgressRepository>();
builder.Services.AddScoped<ITestInterface, TestRepository>();
builder.Services.AddScoped<ITestResultInterface, TestResultRepository>();
ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: allowReactAppPolicy,
        policy =>
        {
            policy.WithOrigins(allowedOrigins) 
                  .AllowAnyHeader()           
                  .AllowAnyMethod()         
                  .AllowCredentials();    
        });
});

builder.Services.AddSignalR();

builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "CoursesAPI", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 12;
}).AddEntityFrameworkStores<ApplicationDbContext>();


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        options.DefaultChallengeScheme =
            options.DefaultForbidScheme =
                options.DefaultScheme =
                    options.DefaultSignInScheme =
                        options.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JWT:SigningKey"] ?? string.Empty))
    };
     
     options.Events = new JwtBearerEvents
     {
         OnMessageReceived = context =>
         {
             var accessToken = context.Request.Query["access_token"];
             var path = context.HttpContext.Request.Path;
             if (!string.IsNullOrEmpty(accessToken) &&
                 (path.StartsWithSegments("/chathub"))) 
             {
                 context.Token = accessToken;
             }
             return Task.CompletedTask;
         }
     };
});

builder.Services.AddHttpClient(); 

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseWebSockets();
app.UseRouting();
app.UseCors(allowReactAppPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<ChatHubService>("/chathub");
app.MapControllers();

app.Run();