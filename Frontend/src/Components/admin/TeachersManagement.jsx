import React from 'react';
import { useGetTeachersQuery } from '../../Redux/api/adminApi.js';
import styles from './TeachersManagement.module.css';

const TeachersManagement = () => {
    const { data: teachers = [], isLoading } = useGetTeachersQuery();

    return (
        <div>
            <h2 className={styles.pageTitle}>Преподаватели</h2>

            {isLoading ? (
                <p className={styles.empty}>Загрузка…</p>
            ) : teachers.length === 0 ? (
                <p className={styles.empty}>Преподавателей пока нет. Назначьте роль Teacher пользователю.</p>
            ) : (
                <div className={styles.grid}>
                    {teachers.map(t => {
                        const completion = Math.round((t.averageStudentCompletion ?? 0) * 100);
                        return (
                            <div key={t.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    {t.profilePhotoUrl
                                        ? <img src={t.profilePhotoUrl} alt="" className={styles.avatar} />
                                        : <div className={styles.avatarPlaceholder}>{(t.username || '?').slice(0, 1).toUpperCase()}</div>}
                                    <div>
                                        <h3 className={styles.name}>{t.username || '—'}</h3>
                                        <span className={styles.subtle}>{t.email || t.telegramUsername || '—'}</span>
                                    </div>
                                </div>

                                <div className={styles.stats}>
                                    <div className={styles.statBlock}>
                                        <span className={styles.statValue}>{t.ownedCoursesCount ?? 0}</span>
                                        <span className={styles.statLabel}>Курсов</span>
                                    </div>
                                    <div className={styles.statBlock}>
                                        <span className={styles.statValue}>{t.totalStudents ?? 0}</span>
                                        <span className={styles.statLabel}>Студентов</span>
                                    </div>
                                </div>

                                <div className={styles.progressBlock}>
                                    <div className={styles.progressTop}>
                                        <span>Средний прогресс</span>
                                        <strong>{completion}%</strong>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <span style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeachersManagement;
