
import React, {useState, useEffect, useCallback} from 'react';
import styles from './LessonPageContent.module.css';
import TestComponent from "../TestComponent.jsx";
import {useParams} from "react-router-dom";
import {useDeleteLessonMutation, useGetLessonsQuery, useGetSoloLessonQuery} from "../../../Redux/api/lessonApi.js";
import RenderFileItem from "./RenderFileItem.jsx";
import {useGetCoursesQuery} from "../../../Redux/api/coursesApi.js";

const CoursesPageContent = (props) => {
    const {courseId} = useParams();
    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [mainContentView, setMainContentView] = useState('lesson');

    const {data: courseInfo = [],isLoading: isLoadingCourses, error: coursesError} = useGetCoursesQuery()

    const {
        data: lessonsList = [],
        isLoading: isLoadingLessons,
        error: lessonsError
    } = useGetLessonsQuery(courseId);

    const {
        data: lessonInfo,
        isLoading: isLoadingLessonInfo,
        error: lessonInfoError
    } = useGetSoloLessonQuery({courseId, lessonId: selectedLessonId}, {
        skip: !selectedLessonId || !courseId,
    });

    const [deleteLesson, {isLoading: isDeletingLesson, error: deleteLessonError}] = useDeleteLessonMutation();

    useEffect(() => {
        if (lessonsList && lessonsList.length > 0 && selectedLessonId === null) {
            setSelectedLessonId(lessonsList[0].id);
        }
    }, [lessonsList, selectedLessonId]);

    const handleSelectLesson = (lessonId) => {
        setSelectedLessonId(lessonId);
        setMainContentView('lesson');
    };

    const handleShowTest = () => {
        setMainContentView('test');
    };

    const handleDeleteLesson = async () => {
        const isConfirmed = window.confirm(`Вы уверены, что хотите удалить урок "${lessonInfo?.name || 'без названия'}"?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteLesson({courseId, lessonId: selectedLessonId}).unwrap();
            setSelectedLessonId(null);
        } catch (error) {
            alert(`Не удалось удалить урок: ${error?.data?.message || error?.error || JSON.stringify(error)}`);
        }
    };

    const getFileNameFromKey = (key, defaultName) => {
        if (!key) return defaultName;
        try {
            const url = new URL(key);
            const fileName = url.pathname.split('/').pop();
            const decodedFileName = decodeURIComponent(fileName?.split('?')[0] || '');
            return decodedFileName || defaultName;
        } catch (e) {
            const fileName = key.split('/').pop();
            const decodedFileName = decodeURIComponent(fileName?.split('?')[0] || '');
            return decodedFileName || defaultName;
        }
    };

    const getFileTypeFromKey = useCallback((key) => {
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
    }, []);

    if (isLoadingLessons) {
        return <div className={styles.loading}>Загрузка уроков...</div>;
    }

    if (lessonsError) {
        const lessonListErrorMsg = lessonsError?.data?.message || lessonsError?.error || JSON.stringify(lessonsError);
        return <div className={styles.error}>Ошибка загрузки уроков: {lessonListErrorMsg}</div>;
    }

    if (!lessonsList || lessonsList.length === 0) {
        return <div className={styles.noContent}>Нет доступных уроков для этого курса.</div>;
    }

    return (
        <div className={styles.courses}>

            <aside className={styles.sidebar}>
                <h2>Доступные уроки</h2>
                {lessonsList.map((lesson) => (
                    <div
                        key={lesson.id}
                        className={`${styles.lessonItem} ${selectedLessonId === lesson.id ? styles.active : ''}`}
                        onClick={() => handleSelectLesson(lesson.id)}
                    >
                        <h3>{lesson.name}</h3>
                        <p>{lesson.description}</p>
                        {lesson.duration && <span className={styles.duration}>{lesson.duration}</span>}
                    </div>
                ))}
            </aside>

            <main className={styles.content}>
                {mainContentView === 'lesson' && (
                    <>
                        {isLoadingLessonInfo && <div className={styles.loading}>Загрузка данных урока...</div>}
                        {lessonInfoError && (
                            <div className={styles.error}>
                                Ошибка загрузки данных
                                урока: {lessonInfoError?.data?.message || lessonInfoError?.error || JSON.stringify(lessonInfoError)}
                            </div>
                        )}


                        {!isLoadingLessonInfo && !lessonInfoError && lessonInfo && (
                            <div>
                                <h2>{lessonInfo.name}</h2>

                                <div className={styles.lectureText}>
                                    <p>{lessonInfo.description}</p>
                                </div>


                                {lessonInfo.videoKeys && lessonInfo.videoKeys.length > 0 ? (
                                    <div className={styles.videoWrapper}>
                                        <iframe
                                            src={lessonInfo.videoKeys[0]}
                                            title={lessonInfo.name || 'Видео урока'}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                            allowFullScreen
                                        >
                                            Ваш браузер не поддерживает встроенное видео.
                                        </iframe>
                                    </div>
                                ) : (
                                    !lessonInfo.photoKeys?.some(key => getFileTypeFromKey(key) === 'video_file') &&
                                    !lessonInfo.ebookKeys?.some(key => getFileTypeFromKey(key) === 'video_file') &&
                                    !lessonInfo.lectureKeys?.some(key => getFileTypeFromKey(key) === 'video_file') &&
                                    !lessonInfo.audioKeys?.some(key => getFileTypeFromKey(key) === 'video_file')
                                    && (
                                        <div className={styles.noVideoMessage}>
                                            <p>Видео для этого урока недоступно.</p>
                                        </div>
                                    )
                                )}

                                {lessonInfo.textLectures && lessonInfo.textLectures.length > 0 && (
                                    <div className={styles.contentSection}>
                                        <h3>Текстовые лекции:</h3>
                                        {lessonInfo.textLectures.map((text, index) => (
                                            <p key={index} className={styles.lectureText}>{text}</p>
                                        ))}
                                    </div>
                                )}

                                {lessonInfo.lectureKeys && lessonInfo.lectureKeys.length > 0 && (
                                    <div className={styles.contentSection}>
                                        <h3>Материалы лекции (файлы):</h3>
                                        <ul className={styles.fileList}>
                                            {lessonInfo.lectureKeys.map((key, index) => (
                                                <RenderFileItem key={index} fileKey={key} index={index}
                                                                sectionName="Материал лекции"/>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {lessonInfo.photoKeys && lessonInfo.photoKeys.length > 0 && (
                                    <div className={styles.contentSection}>
                                        <h3>Фотографии и Документы:</h3>
                                        <ul className={styles.fileList}>
                                            {lessonInfo.photoKeys.map((key, index) => (
                                                <RenderFileItem key={index} fileKey={key} index={index}
                                                                sectionName="Фото/Документ"/>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {lessonInfo.audioKeys && lessonInfo.audioKeys.length > 0 && (
                                    <div className={styles.contentSection}>
                                        <h3>Аудиозаписи:</h3>
                                        <ul className={styles.audioList}>
                                            {lessonInfo.audioKeys.map((key, index) => (
                                                <RenderFileItem key={index} fileKey={key} index={index}
                                                                sectionName="Аудиозапись"/>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {lessonInfo.ebookKeys && lessonInfo.ebookKeys.length > 0 && (
                                    <div className={styles.contentSection}>
                                        <h3>Книги и Материалы:</h3>
                                        <ul className={styles.fileList}>
                                            {lessonInfo.ebookKeys.map((key, index) => (
                                                <RenderFileItem key={index} fileKey={key} index={index}
                                                                sectionName="Материал"/>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className={styles.lessonButtons}>
                                    {lessonInfo.tests && lessonInfo.tests.length > 0 && (
                                        <button onClick={handleShowTest} className={styles.takeTestButton}>
                                            Пройти тест по этому уроку
                                        </button>
                                    )}

                                    {props.role === 'Admin' && (
                                        <button
                                            onClick={handleDeleteLesson}
                                            className={styles.takeTestButton}
                                            disabled={isDeletingLesson}
                                        >
                                            {isDeletingLesson ? 'Удаление...' : 'Удалить урок'}
                                        </button>
                                    )}
                                </div>
                                {
                                    !isLoadingCourses && !coursesError && courseInfo && courseInfo.length > 0 && (
                                        (() => {
                                            const currentCourse = courseInfo.find(course => course.id == courseId);
                                            const courseAdmins = currentCourse?.admins;

                                            return (
                                                <div className={styles.adminsSection}>
                                                    <h3>Администраторы курса:</h3>
                                                    {courseAdmins && Object.keys(courseAdmins).length > 0 ? (
                                                        <ul className={styles.adminList}>
                                                            {Object.entries(courseAdmins).map(([adminIdOrName, telegramHandle]) => (
                                                                <li key={adminIdOrName}>
                                                                    <strong>{adminIdOrName}:</strong> {telegramHandle}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p>У этого курса пока нет администраторов.</p>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    )
                                }

                            </div>
                        )}
                    </>
                )}
                {mainContentView === 'test' && (
                    <TestComponent lessonId={selectedLessonId} courseId={courseId}/>
                )}
            </main>
        </div>
    );
};

export default CoursesPageContent;