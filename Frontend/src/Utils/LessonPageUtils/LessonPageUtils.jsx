export const getFileNameFromKey = (key, defaultName) => {
    if (!key) return defaultName;
    try {
        let raw;
        try {
            const url = new URL(key);
            raw = url.pathname.split('/').pop();
        } catch {
            raw = key.split('/').pop();
        }
        const decoded = decodeURIComponent(raw?.split('?')[0] || '');
        if (decoded.includes('__')) {
            const afterUuid = decoded.split('__').slice(1).join('__');
            if (afterUuid) return afterUuid;
        }
        return decoded || defaultName;
    } catch {
        return defaultName;
    }
};

export const getFileTypeFromKey = (key) => {
    if (!key) return 'unknown';
    const url = key.split('?')[0];
    const extension = url.split('.').pop()?.toLowerCase();

    if (!extension) return 'unknown';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) return 'audio';
    if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv'].includes(extension)) return 'video_file';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['txt', 'log', 'md', 'rtf'].includes(extension)) return 'text';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(extension)) return 'document';
    if (['epub', 'fb2', 'mobi', 'azw', 'azw3'].includes(extension)) return 'ebook';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';

    return 'unknown';
};