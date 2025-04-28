import React, { useState } from 'react';
import styles from './CourseDetail.module.css';
import { useParams } from "react-router-dom";
import { useDeleteUserMutation } from "../../../../Redux/api/coursesApi.js";

const CourseProgressTable = ({
    courseProgressData,
    courseProgressLoading,
    courseProgressError,
    lessonsData,
}) => {

    const { courseId } = useParams();

    const [deletingUsername, setDeletingUsername] = useState(null);
    const [
        deleteUser,
        {
            isLoading: isDeletingUser,
            isError: isDeleteUserError,
            error: deleteUserErrorDetails
        }
    ] = useDeleteUserMutation();

    const handleDeleteUser = async (username) => {
        if (!courseId) {
            alert("Невозможно удалить ученика: отсутствует идентификатор курса.");
            return;
        }
        if (!username || !username.trim()) {
            alert("Невозможно удалить: отсутствует ник пользователя.");
            return;
        }

        const isConfirmed = window.confirm(`Вы уверены, что хотите удалить ученика "${username.trim()}" из этого курса?`);

        if (!isConfirmed) {
            return;
        }
        setDeletingUsername(username);

        try {
            await deleteUser({ courseId: courseId, telegramUsername: username }).unwrap();
            console.log(`Ученик ${username} успешно удален.`);
        } catch (error) {
            const deleteErrorMsg = error?.data?.message || error?.error || 'Неизвестная ошибка при удалении ученика';
            console.error(`Ошибка при удалении ученика ${username}:`, error);
            alert(`Не удалось удалить ученика "${username}": ${deleteErrorMsg}`);
        } finally {
            setDeletingUsername(null);
        }
    };


    if (courseProgressLoading) {
        return <p>Загрузка прогресса учеников...</p>;
    }

    if (courseProgressError) {
        const progressErr = courseProgressError?.data?.message || courseProgressError?.error || 'Неизвестная ошибка';
        return <p className={styles.error}>Ошибка загрузки прогресса учеников: {progressErr}</p>;
    }

    {
        isDeleteUserError && (
            <p className={styles.error}>Ошибка
                удаления: {deleteUserErrorDetails?.data?.message || deleteUserErrorDetails?.message || 'Неизвестная ошибка удаления'}</p>
        )
    }


    if (!courseProgressData || courseProgressData.length === 0) {
        return <p>Нет данных о прогрессе учеников для этого курса.</p>;
    }
    if (!lessonsData || lessonsData.length === 0) {
        console.warn("Данные прогресса загружены, но нет данных уроков для формирования таблицы.");
        return <p>Нет данных уроков для отображения прогресса.</p>;
    }


    return (
        <div className={styles.studentsArea}>
            <h4>Прогресс учеников по курсу</h4>
            <div className={styles.progressTableContainer}>
                <table className={styles.progressTable}>
                    <thead>
                        <tr>
                            <th>Ученик</th>
                            <th>Прогресс по курсу</th>
                            {lessonsData.map(lesson => (
                                <th key={lesson.id}>{lesson.name}</th>
                            ))}
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courseProgressData.map((userProgress, index) => (
                            <tr key={userProgress.username || index}>
                                <td>
                                    <a href={`https://t.me/${userProgress.username}`} target="_blank"
                                        rel="noopener noreferrer">
                                        {userProgress.username}
                                    </a>
                                </td>
                                <td>{userProgress.completionPercentage}%</td>
                                {lessonsData.map(lesson => {
                                    const lessonProgress = userProgress.lessonProgresses?.find(lp => lp.lessonId === lesson.id);
                                    return (
                                        <td key={lesson.id}>
                                            {lessonProgress ?
                                                lessonProgress.isCompleted ?
                                                    `Завершено (${lessonProgress.testScore != null ? lessonProgress.testScore : 'нет теста'})`
                                                    : `Не завершено (${lessonProgress.testScore != null ? lessonProgress.testScore : 'нет теста'})`
                                                : '-'
                                            }
                                        </td>
                                    );
                                })}
                                <td>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteUser(userProgress.username)}
                                        disabled={isDeletingUser || deletingUsername === userProgress.username}
                                    >
                                        {deletingUsername === userProgress.username ? 'Удаление...' : 'Удалить'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseProgressTable;