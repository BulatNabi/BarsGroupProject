import styles from "./LessonPageContent.module.css";
import React from "react";
import {getFileNameFromKey, getFileTypeFromKey} from "../../../Utils/LessonPageUtils/LessonPageUtils.jsx";

const RenderFileItem = ({fileKey, index, sectionName}) => {
    const fileType = getFileTypeFromKey(fileKey);
    const fileName = getFileNameFromKey(fileKey, `${sectionName} ${index + 1}`);

    let content;

    if (fileType === 'image') {
        content = <img src={fileKey} alt={fileName} className={styles.embeddedImage}/>;
    } else if (fileType === 'audio') {
        content = (
            <audio controls src={fileKey}>
                Ваш браузер не поддерживает аудио.
            </audio>
        );
    } else if (fileType === 'video_file') {
        content = (
            <video controls src={fileKey} className={styles.videoPlayer}>
                Ваш браузер не поддерживает видео.
            </video>
        );
    } else if (fileType === 'pdf') {
        content = (
            <div className={styles.pdfEmbedContainer}>
                <iframe
                    src={fileKey}
                    width="100%"
                    height="100%"
                    style={{border: 'none'}}
                    title={`Просмотр PDF: ${fileName}`}
                    allowFullScreen
                >
                    Ваш браузер не поддерживает встраивание PDF.
                </iframe>
            </div>
        );
    }

    if (['image', 'audio', 'video_file', 'pdf'].includes(fileType) && content) {
        return (
            <li key={index} className={styles.fileItem}>
                <div className={styles.filePreview}>
                    {content}
                </div>
                <div className={styles.fileDetails}>
                    <a href={fileKey} target="_blank" rel="noopener noreferrer" download={fileName}
                       className={styles.downloadLink}>
                        Скачать {fileType.charAt(0).toUpperCase() + fileType.slice(1)}{fileType !== 'pdf' && fileType !== 'image' ? 'файл' : ''}
                    </a>
                </div>
            </li>
        );
    }

    return (
        <li key={index} className={styles.fileItem}>
            <a href={fileKey} target="_blank" rel="noopener noreferrer" download={fileName}
               className={styles.fileLinkContent}>
                <div className={styles.fileIcon}>
                    {fileType === 'document' && '📄'}
                    {fileType === 'ebook' && '📚'}
                    {fileType === 'text' && '📝'}
                    {fileType === 'archive' && '📦'}
                    {fileType === 'image' && '🖼️'}
                    {fileType === 'audio' && '🎵'}
                    {fileType === 'video_file' && '🎥'}
                    {fileType === 'pdf' && '📄'}
                    {fileType === 'unknown' && '❓'}
                </div>
                <div className={styles.fileInfo}>
                    <p className={styles.linkedFileName}>{fileName}</p>
                    {fileType !== 'unknown' && (
                        <p className={styles.linkedFileType}>{fileType.charAt(0).toUpperCase() + fileType.slice(1)} файл</p>
                    )}
                </div>
                <div className={styles.downloadIcon}>
                    ⬇️
                </div>
            </a>
        </li>
    );
};

export default RenderFileItem;