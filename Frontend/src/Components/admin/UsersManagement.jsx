import React, { useState } from 'react';
import {
    useGetUsersQuery,
    useChangeRoleMutation,
    useDeleteUserMutation,
    useBlockUserMutation,
    useUnblockUserMutation,
} from '../../Redux/api/adminApi.js';
import styles from './UsersManagement.module.css';

const ROLES = ['Admin', 'Teacher', 'User'];

const roleBadgeClass = (role) => {
    if (role === 'Admin') return styles.roleAdmin;
    if (role === 'Teacher') return styles.roleTeacher;
    return styles.roleUser;
};

const UsersManagement = () => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editing, setEditing] = useState(null);
    const [blocking, setBlocking] = useState(null);
    const [blockReason, setBlockReason] = useState('');

    const { data: users = [], isLoading } = useGetUsersQuery({
        search: search || undefined,
        role: roleFilter || undefined,
    });
    const [changeRole, { isLoading: changing }] = useChangeRoleMutation();
    const [deleteUser] = useDeleteUserMutation();
    const [blockUser, { isLoading: blockingNow }] = useBlockUserMutation();
    const [unblockUser] = useUnblockUserMutation();

    const exportXlsx = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/export/overview.xlsx', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Platform_Overview_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Не удалось скачать отчёт');
        }
    };

    const onChangeRole = async (role) => {
        if (!editing) return;
        try {
            await changeRole({ id: editing.id, role }).unwrap();
            setEditing(null);
        } catch (e) {
            alert('Не удалось сменить роль');
        }
    };

    const onDelete = async (user) => {
        if (!confirm(`Удалить пользователя «${user.username}»?`)) return;
        try {
            await deleteUser(user.id).unwrap();
        } catch (e) {
            const msg = e?.data || 'Ошибка удаления';
            alert(typeof msg === 'string' ? msg : 'Не удалось удалить пользователя');
        }
    };

    const onBlock = async () => {
        if (!blocking) return;
        try {
            await blockUser({ id: blocking.id, reason: blockReason || undefined }).unwrap();
            setBlocking(null);
            setBlockReason('');
        } catch (e) {
            alert('Не удалось заблокировать');
        }
    };

    const onUnblock = async (user) => {
        try {
            await unblockUser(user.id).unwrap();
        } catch (e) {
            alert('Не удалось разблокировать');
        }
    };

    return (
        <div>
            <h2 className={styles.pageTitle}>Пользователи</h2>

            <div className={styles.toolbar}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Поиск по имени, email или telegram…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className={styles.roleSelect}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">Все роли</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className={styles.primaryButton} onClick={exportXlsx}>Экспорт XLSX</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Пользователь</th>
                            <th>Email / Telegram</th>
                            <th>Роль</th>
                            <th>Курсы</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className={styles.empty}>Загрузка…</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className={styles.empty}>Нет пользователей</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <strong>{u.username || '—'}</strong>
                                        {u.isBlocked && <span className={styles.blockedTag}>заблокирован</span>}
                                    </td>
                                    <td className={styles.subtle}>{u.email || u.telegramUsername || '—'}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${roleBadgeClass(u.role)}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={styles.subtle}>
                                        {u.ownedCoursesCount ?? 0} / {u.enrolledCoursesCount ?? 0}
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.smallButton}
                                                onClick={() => setEditing(u)}
                                            >Роль</button>
                                            {u.isBlocked ? (
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => onUnblock(u)}
                                                >Разблок.</button>
                                            ) : (
                                                <button
                                                    className={`${styles.smallButton} ${styles.dangerButton}`}
                                                    onClick={() => { setBlocking(u); setBlockReason(''); }}
                                                >Блок.</button>
                                            )}
                                            <button
                                                className={`${styles.smallButton} ${styles.dangerButton}`}
                                                onClick={() => onDelete(u)}
                                            >×</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className={styles.overlay} onClick={() => setEditing(null)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <h3>Сменить роль для {editing.username}</h3>
                        <p className={styles.dialogText}>Текущая роль: <strong>{editing.role}</strong></p>
                        <div className={styles.roleButtons}>
                            {ROLES.map(r => (
                                <button
                                    key={r}
                                    className={styles.primaryButton}
                                    disabled={changing || r === editing.role}
                                    onClick={() => onChangeRole(r)}
                                >{r}</button>
                            ))}
                        </div>
                        <button className={styles.cancelButton} onClick={() => setEditing(null)}>Отмена</button>
                    </div>
                </div>
            )}

            {blocking && (
                <div className={styles.overlay} onClick={() => setBlocking(null)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <h3>Заблокировать «{blocking.username}»?</h3>
                        <p className={styles.dialogText}>
                            Пользователь не сможет войти. Получит уведомление в платформе и в Telegram (если привязан).
                        </p>
                        <label className={styles.fieldLabel}>Причина (видна пользователю)</label>
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Например: нарушение правил платформы"
                        />
                        <div className={styles.dialogActions}>
                            <button className={styles.cancelButton} onClick={() => setBlocking(null)}>Отмена</button>
                            <button
                                className={`${styles.primaryButton} ${styles.dangerButton}`}
                                disabled={blockingNow}
                                onClick={onBlock}
                            >Заблокировать</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;
