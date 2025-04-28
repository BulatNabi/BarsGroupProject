namespace CoursesAPI.Interfaces;

public interface IS3Interface
{
        Task<string> UploadFileAsync(IFormFile? file, string path);
        Task<Stream> GetVideoStreamAsync(string key);
        string GetFileUrl(string key); 
        Task DeleteFileAsync(string key);
        
}