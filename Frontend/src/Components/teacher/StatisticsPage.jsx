import React, {useMemo, useState} from 'react';
import styles from './StatisticsPage.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useParams } from "react-router-dom";
import { useGetCoursesQuery, useGetPlatformProgressQuery } from "../../Redux/api/coursesApi.js";

const StatisticsPage = () => {
    const navigate = useNavigate();

    const { data: coursesData = [], isLoading, error } = useGetCoursesQuery();
    const { data: platformProgress = [], isLoading: platformLoading, error: platformError } = useGetPlatformProgressQuery();

    const chartData = useMemo(() => {
        const threeCourses = platformProgress?.threeCourses;
        if (threeCourses && typeof threeCourses === 'object') {
            return Object.entries(threeCourses).map(([courseName, progress]) => ({
                course: courseName,
                progress: progress
            }));
        }
        return [];
    }, [platformProgress]);

    const handleCourseClick = (courseId) => {
        navigate(`/teacher/mycourses/detail/${courseId}`);
    };

    return (
        <div className={styles.statisticsContainer}>
            <h2 className={styles.title}>📊 Статистика платформы</h2>

            <div className={styles.cardsContainer}>
                <div className={styles.statCard}>
                    <h3>👤 Всего пользователей</h3>
                    <p className={styles.statNumber}>{platformProgress.allUsersCount}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>📚 Всего курсов</h3>
                    <p className={styles.statNumber}>{platformProgress.allCoursesCount}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>✅ Завершено курсов</h3>
                    <p className={styles.statNumber}>{platformProgress.allCompletedCoursesCount}</p>
                </div>
            </div>

            <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>📈 Процент прохождения / Статистика по 3 курсам</h3>
                {platformLoading ? (
                    <p>Загрузка данных для графика...</p>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="course" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="progress" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p>Нет данных для отображения графика по курсам.</p>
                )}
            </div>

            <div className={styles.topStudentsSection}>
                <h3 className={styles.sectionTitle}>🏆 Топ студентов по завершённым курсам</h3>
                <ul className={styles.studentsList}>
                    {platformProgress?.bestUsers && Array.isArray(platformProgress.bestUsers) && (
                        platformProgress.bestUsers.map((student, index) => (
                            <li key={index} className={styles.studentItem}>
                                {index + 1}. {student}
                            </li>
                        ))
                    )}
                    {(!platformProgress || !platformProgress.bestUsers || platformProgress.bestUsers.length === 0) && !isLoading && (
                        <p>Нет данных о лучших пользователях или данные еще загружаются.</p>
                    )}
                </ul>
            </div>

            <div>
                <h3>Список курсов</h3>
                <ul className={styles.studentsList}>
                    {coursesData.map((course, index) => (
                        <li key={index} className={styles.studentItem} onClick={() => { handleCourseClick(course.id) }}>
                            {index + 1}. {course.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default StatisticsPage;
