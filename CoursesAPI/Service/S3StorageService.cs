using System.Net;
using System.Text;
using Amazon.S3;
using Amazon.S3.Model;
using CoursesAPI.Interfaces;

namespace CoursesAPI.Service;

public class S3Service : IS3Interface
{
    private readonly IAmazonS3 _client;
    private readonly string? _bucket;
    private readonly int _expiryHours;

    public S3Service(IConfiguration config)
    {
        _bucket = config["S3Config:BucketName"]; 
        _expiryHours = config.GetValue<int>("S3Config:TempUrlExpiryHours");

        
        _client = new AmazonS3Client(
            config["S3Config:AccessKey"],
            config["S3Config:SecretKey"],
            new AmazonS3Config
            {
                ServiceURL = config["S3Config:ServiceURL"],
                AuthenticationRegion = "ru-central1"
                
            }
        );
    }

    public async Task<string> UploadFileAsync(IFormFile? file, string path)
    {
        Console.WriteLine(_bucket);
        if (file == null) return String.Empty;
        
        var key = $"{path}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        await using var stream = file.OpenReadStream();
        var contentType = file.ContentType;
        if (!string.IsNullOrEmpty(contentType) && contentType.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
        {
            contentType += "; charset=utf-8";
        }
        var request = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType
        };
        
        await _client.PutObjectAsync(request);
        return key;
    }
    
    public async Task<Stream> GetVideoStreamAsync(string key)
    {
        var response = await _client.GetObjectAsync(_bucket, key);
        return response.ResponseStream;
    }

    public string GetFileUrl(string key)
    {
        string decodedKey = Uri.UnescapeDataString(key); 
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = decodedKey, 
            Expires = DateTime.UtcNow.AddHours(_expiryHours),
            Protocol = Protocol.HTTPS
        };
        return _client.GetPreSignedURL(request);
    }
    
    public async Task DeleteFileAsync(string key)
    {
        await _client.DeleteObjectAsync(_bucket, key);
    }
    
}