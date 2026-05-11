import React, { useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
    useGetTimeseriesQuery,
    useGetCourseStatsQuery,
} from '../../Redux/api/adminApi.js';
import styles from './PlatformStatistics.module.css';

const METRICS = [
    { value: 'enrollments', label: 'Записи' },
    { value: 'courses', label: 'Новые курсы' },
    { value: 'completions', label: 'Завершения' },
];

const RANGES = [
    { value: 7, label: '7 дней' },
    { value: 30, label: '30 дней' },
    { value: 90, label: '90 дней' },
];

const PALETTE = ['#8A2BE2', '#4B0082', '#6c2eb7', '#a64fee', '#7b24ca'];

const formatDate = (s) =>
    new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

const PlatformStatistics = () => {
    const [metric, setMetric] = useState('enrollments');
    const [days, setDays] = useState(30);

    const { data: tsData = [] } = useGetTimeseriesQuery({ metric, days });
    const { data: courseStats = [] } = useGetCourseStatsQuery();

    const ts = tsData.map(p => ({
        date: formatDate(p.Date ?? p.date),
        value: p.Value ?? p.value,
    }));

    const topCourses = courseStats.slice(0, 10).map(c => ({
        name: (c.title ?? c.Title ?? '').slice(0, 18),
        enrollments: c.enrollments ?? c.Enrollments ?? 0,
        completion: Math.round(((c.averageCompletion ?? c.AverageCompletion) ?? 0) * 100),
    }));

    return (
        <div>
            <h2 className={styles.pageTitle}>Статистика</h2>

            <div className={styles.widgetCard}>
                <div className={styles.widgetHead}>
                    <h3 className={styles.widgetTitle}>Метрика во времени</h3>
                    <div className={styles.controls}>
                        <select
                            className={styles.select}
                            value={metric}
                            onChange={(e) => setMetric(e.target.value)}
                        >
                            {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select
                            className={styles.select}
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                        >
                            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ts} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#888' }} width={32} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#8A2BE2" strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.chartsRow}>
                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Топ-10 курсов по записям</h3>
                    <div style={{ width: '100%', height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCourses} layout="vertical" margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#888' }} width={120} />
                                <Tooltip />
                                <Bar dataKey="enrollments" radius={[0, 6, 6, 0]}>
                                    {topCourses.map((_, i) => (
                                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.widgetCard}>
                    <h3 className={styles.widgetTitle}>Средний прогресс по курсам</h3>
                    <div style={{ width: '100%', height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCourses} layout="vertical" margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#888' }} width={120} />
                                <Tooltip />
                                <Bar dataKey="completion" fill="#6c2eb7" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformStatistics;
