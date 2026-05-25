import React from 'react';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts';
import {
    useGetOverviewStatsQuery,
    useGetTimeseriesQuery,
} from '../../Redux/api/adminApi.js';
import styles from './AdminDashboard.module.css';

const formatDate = (s) =>
    new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

const AdminDashboard = () => {
    const { data: stats, isLoading } = useGetOverviewStatsQuery();
    const { data: series = [] } = useGetTimeseriesQuery({ metric: 'enrollments', days: 30 });

    const chartData = series.map(p => ({
        date: formatDate(p.Date ?? p.date),
        value: p.Value ?? p.value,
    }));

    const topCourses = (stats?.topCourses ?? stats?.TopCourses ?? []).map(c => ({
        name: (c.title ?? c.Title ?? '').slice(0, 14),
        value: c.enrollments ?? c.Enrollments ?? 0,
    }));

    const stat = (camel, pascal) => stats?.[camel] ?? stats?.[pascal] ?? 0;

    return (
        <div>
            <h2 className={styles.pageTitle}>Дашборд администратора</h2>
            <p className={styles.pageDescription}>
                Обзор активности на платформе: пользователи, курсы, преподаватели и статистика.
            </p>

            <div className={styles.statGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Пользователи</span>
                    <span className={styles.statValue}>{isLoading ? '…' : stat('totalUsers', 'TotalUsers')}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Преподаватели</span>
                    <span className={styles.statValue}>{isLoading ? '…' : stat('totalTeachers', 'TotalTeachers')}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Курсы</span>
                    <span className={styles.statValue}>{isLoading ? '…' : stat('totalCourses', 'TotalCourses')}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Средний прогресс</span>
                    <span className={styles.statValue}>
                        {isLoading ? '…' : Math.round(stat('averageCompletion', 'AverageCompletion')) + '%'}
                    </span>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Записи на курсы — последние 30 дней</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8A2BE2" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#8A2BE2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} width={32} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8A2BE2"
                                    strokeWidth={2}
                                    fill="url(#enrollGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Топ курсов</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCourses} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#888' }} width={32} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6c2eb7" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className={styles.quickLinks}>
                <Link to="/admin/users" className={styles.linkCard}>
                    <h4>Управление пользователями</h4>
                    <span>Поиск, смена роли, блокировка</span>
                </Link>
                <Link to="/admin/feedback" className={styles.linkCard}>
                    <h4>Обратная связь</h4>
                    <span>Сообщения от учеников и преподавателей</span>
                </Link>
                <Link to="/admin/stats" className={styles.linkCard}>
                    <h4>Статистика</h4>
                    <span>Графики и аналитика</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
