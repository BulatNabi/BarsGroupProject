import React from 'react';
import styles from './CourseDetail.module.css';
import { useLazyDownloadCourseProgressQuery } from '../../../../Redux/api/coursesApi';
import { useParams } from 'react-router-dom';

const CourseLessonsSection = ({
                                  lessonsData,
                                  lessonsLoading,
                                  lessonsError,
                                  handleAddLessonClick,
                                  handleLessonClick
                              }) => {
    const { courseId } = useParams();

    const [
        triggerDownloadProgress,
        { isFetching: isDownloadingProgress, error: downloadProgressError }
    ] = useLazyDownloadCourseProgressQuery();

    const handleDownloadCourseProgress = async () => {
        if (!courseId) {
            console.error("Не выбран курс для загрузки прогресса");
            alert("Ошибка: не удалось определить курс для выгрузки прогресса.");
            return;
        }

        const isConfirmed = window.confirm(`Вы уверены, что хотите выгрузить прогресс по этому курсу в эксель таблицу?`);
        if (!isConfirmed) {
            return;
        }

        try {
            const result = await triggerDownloadProgress(courseId).unwrap();

            if (result && typeof result === 'string') {
                window.open(result, '_blank');
            } else {
                console.error("Ошибка загрузки прогресса: Ответ API не является строкой URL.", result);
                alert("Не удалось получить ссылку для скачивания файла прогресса.");
            }

        } catch (error) {
            console.error("Ошибка при загрузке прогресса курса:", error);
            alert(`Не удалось загрузить эксель: ${error?.data?.message || error?.error || 'Неизвестная ошибка API при получении ссылки'}`);
        }
    };


    return (
        <div className={styles.lessonsArea}>
            <button className={styles.editButton} onClick={handleAddLessonClick}>
                Добавить урок
            </button>
            <h4>Уроки:</h4>
            {lessonsLoading ? (
                <p>Загрузка уроков...</p>
            ) : lessonsError ? (
                <p className={styles.error}>Ошибка загрузки уроков: {lessonsError?.data?.message || lessonsError?.error || 'Неизвестная ошибка'}</p>
            ) : lessonsData && lessonsData.length ? (
                <ul>
                    {lessonsData.map((lesson, index) => (
                        <li
                            key={lesson.id || index}
                            className={styles.lessonItemInList}
                            onClick={() => handleLessonClick(lesson.id)}
                        >
                            {`Урок ${index + 1}: "${lesson.name}"`}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Уроки для этого курса пока не добавлены.</p>
            )}
            {lessonsData && lessonsData.length > 0 && (
                <button className={styles.exportButton} onClick={handleDownloadCourseProgress} disabled={isDownloadingProgress}>
                    {isDownloadingProgress ? 'Выгрузка...' : 'Выгрузка в Excel'}
                </button>
            )}
            {downloadProgressError && (
                <p className={styles.errorMessage}>Ошибка выгрузки: {downloadProgressError.message || 'Неизвестная ошибка выгрузки'}</p>
            )}
        </div>
    );
};

export default CourseLessonsSection;