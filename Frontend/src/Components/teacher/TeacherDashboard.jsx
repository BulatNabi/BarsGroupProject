import React from 'react';
import styles from './TeacherDashboard.module.css';
import {
    useGetAdminCoursesProgressQuery,
    useGetCoursesQuery
} from "../../Redux/api/coursesApi.js";
import {useNavigate} from "react-router-dom";

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const {data: coursesData = [], isLoading: coursesLoading, error: coursesError} = useGetCoursesQuery();
    const {data: coursesProgress = [], isLoading: loading, error: progressError} = useGetAdminCoursesProgressQuery();


    const recentMessages = [
        { id: 1, sender: 'Иван Петров', preview: 'Здравствуйте, не могу сдать ДЗ...' },
        { id: 2, sender: 'Администрация', preview: 'Важное обновление платформы...' },
        { id: 3, sender: 'Елена Сидорова', preview: 'Вопрос по лекции №5' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h2>Панель управления учителя</h2>
            <p style={{ marginBottom: '30px', color: '#555' }}>
                Обзор актуальной информации: назначенные курсы, последние сообщения от студентов или администрации, уведомления, быстрая статистика.
            </p>

            <div className={styles.dashboardGrid}>
                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Мои курсы</h3>
                    {coursesData.length > 0 ? (
                        <ul className={styles.widgetList}>
                            {coursesData.map(course => (
                                <li key={course.id} className={styles.widgetListItem}>
                                    <span>{course.title} </span>
                                    <button onClick={() => navigate(`/teacher/courses/${course.id}`)}>Перейти</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noData}>У вас нет назначенных курсов.</p>
                    )}
                </div>

                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Последние сообщения</h3>
                    {recentMessages.length > 0 ? (
                        <ul className={styles.widgetList}>
                            {recentMessages.map(msg => (
                                <li key={msg.id} className={styles.widgetListItem}>
                                    <span><strong>{msg.sender}:</strong> {msg.preview}</span>
                                    <button onClick={() => alert(`Открыть сообщение от ${msg.sender}`)}>Читать</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noData}>Нет новых сообщений.</p>
                    )}
                </div>

                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Быстрая статистика</h3>
                    <div className={styles.widgetList}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Активных студентов:</span>
                            <span className={styles.statValue}>{coursesProgress.usersCount}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Ведется курсов:</span>
                            <span className={styles.statValue}>{coursesProgress.coursesCount}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Общий прогресс (усредн.):</span>
                            <span className={styles.statValue}>{coursesProgress.completionPercentage}%</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeacherDashboard;