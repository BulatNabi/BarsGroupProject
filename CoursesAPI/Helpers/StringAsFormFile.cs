using Microsoft.Net.Http.Headers;
namespace CoursesAPI.Helpers;

public class StringAsFormFile : IFormFile
{
    private readonly MemoryStream _memoryStream;
    private readonly string _fileName;
    private readonly string _contentType;
    private readonly string _name;

    public StringAsFormFile(MemoryStream memoryStream, string name, string fileName, string contentType)
    {
        _memoryStream = memoryStream;
        _name = name;
        _fileName = fileName;
        _contentType = contentType;
        Headers = new HeaderDictionary();
    }

    public string ContentType => _contentType;
    public string ContentDisposition => new ContentDispositionHeaderValue("form-data")
    {
        Name = _name,
        FileName = _fileName
    }.ToString();
    public IHeaderDictionary Headers { get; }
    public long Length => _memoryStream.Length;
    public string Name => _name;
    public string FileName => _fileName;

    public Stream OpenReadStream()
    {
        _memoryStream.Position = 0;
        return _memoryStream;
    }

    public void CopyTo(Stream target)
    {
        _memoryStream.Position = 0;
        _memoryStream.CopyTo(target);
    }

    public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
    {
        _memoryStream.Position = 0;
        await _memoryStream.CopyToAsync(target, cancellationToken);
    }
}