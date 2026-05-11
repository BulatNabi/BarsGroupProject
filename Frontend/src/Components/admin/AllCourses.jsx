import React, { useState, useMemo } from 'react';
import { useGetAllCoursesQuery } from '../../Redux/api/adminApi.js';
import styles from './AllCourses.module.css';

const AllCourses = () => {
    const { data: courses = [], isLoading } = useGetAllCoursesQuery();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return courses;
        const q = search.toLowerCase();
        return courses.filter(c =>
            (c.title || '').toLowerCase().includes(q) ||
            (c.ownerUsername || '').toLowerCase().includes(q)
        );
    }, [courses, search]);

    return (
        <div>
            <h2 className={styles.pageTitle}>Все курсы</h2>

            <div className={styles.toolbar}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Поиск по названию или преподавателю…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className={styles.counter}>{filtered.length} курсов</span>
            </div>

            {isLoading ? (
                <p className={styles.empty}>Загрузка…</p>
            ) : filtered.length === 0 ? (
                <p className={styles.empty}>Курсов не найдено</p>
            ) : (
                <div className={styles.grid}>
                    {filtered.map(c => {
                        const completion = Math.round((c.averageCompletion ?? 0) * 100);
                        return (
                            <div key={c.id} className={styles.card}>
                                <div className={styles.preview}>
                                    {c.previewPhotoUrl
                                        ? <img src={c.previewPhotoUrl} alt="" />
                                        : <div className={styles.previewFallback}>Курс</div>}
                                </div>
                                <div className={styles.body}>
                                    <h3 className={styles.title}>{c.title}</h3>
                                    <p className={styles.description}>{c.description}</p>
                                    <div className={styles.meta}>
                                        <span>{c.enrolledUsersCount ?? 0} студентов</span>
                                        <span>{c.lessonsCount ?? 0} уроков</span>
                                        <span>{completion}% прогресс</span>
                                    </div>
                                    <div className={styles.owner}>
                                        Преподаватель: <strong>{c.ownerUsername || '—'}</strong>
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

export default AllCourses;
