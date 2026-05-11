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
    private readonly bool _useHttp;

    public S3Service(IConfiguration config)
    {
        _bucket = config["S3Config:BucketName"];
        _expiryHours = config.GetValue<int>("S3Config:TempUrlExpiryHours");

        var serviceUrl = config["S3Config:ServiceURL"] ?? string.Empty;
        _useHttp = serviceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase);

        var region = config["S3Config:Region"];
        if (string.IsNullOrWhiteSpace(region)) region = "us-east-1";

        _client = new AmazonS3Client(
            config["S3Config:AccessKey"],
            config["S3Config:SecretKey"],
            new AmazonS3Config
            {
                ServiceURL = serviceUrl,
                AuthenticationRegion = region,
                // Required for MinIO; harmless for TimeWeb / Yandex.
                // path-style URLs: https://host/bucket/key  (vs vhost https://bucket.host/key)
                ForcePathStyle = true,
                // Allow plain HTTP for local MinIO deployments.
                UseHttp = serviceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase),
            }
        );
    }

    public async Task EnsureBucketAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_bucket)) return;
        try
        {
            var exists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_client, _bucket);
            if (!exists)
            {
                await _client.PutBucketAsync(new Amazon.S3.Model.PutBucketRequest { BucketName = _bucket }, ct);
            }
        }
        catch (Exception)
        {
            // Best-effort: don't crash startup if the storage backend is unreachable.
        }
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
            Protocol = _useHttp ? Protocol.HTTP : Protocol.HTTPS,
        };
        return _client.GetPreSignedURL(request);
    }
    
    public async Task DeleteFileAsync(string key)
    {
        await _client.DeleteObjectAsync(_bucket, key);
    }
    
}