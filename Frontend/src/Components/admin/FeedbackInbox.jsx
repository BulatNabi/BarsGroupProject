import React, { useState } from 'react';
import {
    useGetFeedbackQuery,
    useReplyFeedbackMutation,
} from '../../Redux/api/adminApi.js';
import styles from './FeedbackInbox.module.css';

const STATUSES = [
    { value: '', label: 'Все' },
    { value: 'Open', label: 'Открытые' },
    { value: 'Replied', label: 'Отвеченные' },
    { value: 'Closed', label: 'Закрытые' },
];

const statusClass = (s) => {
    if (s === 'Open') return styles.statusOpen;
    if (s === 'Replied') return styles.statusReplied;
    return styles.statusClosed;
};

const FeedbackInbox = () => {
    const [status, setStatus] = useState('');
    const [replying, setReplying] = useState(null);
    const [replyText, setReplyText] = useState('');

    const { data: items = [], isLoading } = useGetFeedbackQuery(status || undefined);
    const [reply, { isLoading: replyLoading }] = useReplyFeedbackMutation();

    const send = async () => {
        if (!replying || !replyText.trim()) return;
        try {
            await reply({ id: replying.id, reply: replyText.trim() }).unwrap();
            setReplying(null);
            setReplyText('');
        } catch (e) {
            alert('Не удалось отправить ответ');
        }
    };

    const close = async (id) => {
        try {
            await reply({ id, status: 'Closed' }).unwrap();
        } catch (e) {
            alert('Не удалось закрыть тикет');
        }
    };

    return (
        <div>
            <h2 className={styles.pageTitle}>Обратная связь</h2>

            <div className={styles.tabs}>
                {STATUSES.map(s => (
                    <button
                        key={s.label}
                        className={`${styles.tab} ${status === s.value ? styles.tabActive : ''}`}
                        onClick={() => setStatus(s.value)}
                    >{s.label}</button>
                ))}
            </div>

            {isLoading ? (
                <p className={styles.empty}>Загрузка…</p>
            ) : items.length === 0 ? (
                <p className={styles.empty}>Сюда попадают сообщения от учеников и преподавателей.</p>
            ) : (
                <div className={styles.list}>
                    {items.map(f => (
                        <div key={f.id} className={styles.card}>
                            <div className={styles.head}>
                                <div className={styles.from}>
                                    <div className={styles.avatar}>{(f.username || '?').slice(0, 1).toUpperCase()}</div>
                                    <div>
                                        <strong>{f.username || '—'}</strong>
                                        <span className={styles.subtle}>{f.email || '—'}</span>
                                    </div>
                                </div>
                                <div className={styles.headRight}>
                                    <span className={`${styles.statusBadge} ${statusClass(f.status)}`}>
                                        {f.status}
                                    </span>
                                    <span className={styles.time}>
                                        {new Date(f.createdAt).toLocaleString('ru-RU')}
                                    </span>
                                </div>
                            </div>

                            <h3 className={styles.subject}>{f.subject}</h3>
                            <p className={styles.message}>{f.message}</p>

                            {f.adminReply && (
                                <div className={styles.replyBlock}>
                                    <span className={styles.replyLabel}>
                                        Ответ администратора
                                        {f.repliedAt && ` · ${new Date(f.repliedAt).toLocaleString('ru-RU')}`}
                                    </span>
                                    <p>{f.adminReply}</p>
                                </div>
                            )}

                            {f.status !== 'Closed' && (
                                <div className={styles.actions}>
                                    <button
                                        className={styles.primaryButton}
                                        onClick={() => {
                                            setReplying(f);
                                            setReplyText(f.adminReply || '');
                                        }}
                                    >
                                        {f.adminReply ? 'Изменить ответ' : 'Ответить'}
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={() => close(f.id)}
                                    >Закрыть тикет</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {replying && (
                <div className={styles.overlay} onClick={() => setReplying(null)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <h3>Ответ на «{replying.subject}»</h3>
                        <p className={styles.dialogContext}>
                            <strong>{replying.username}</strong> писал(а):
                        </p>
                        <blockquote className={styles.quote}>{replying.message}</blockquote>
                        <label className={styles.fieldLabel}>Ваш ответ</label>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Ответ будет отправлен в уведомления и Telegram (если привязан)"
                        />
                        <div className={styles.dialogActions}>
                            <button className={styles.cancelButton} onClick={() => setReplying(null)}>Отмена</button>
                            <button
                                className={styles.primaryButton}
                                disabled={replyLoading || !replyText.trim()}
                                onClick={send}
                            >Отправить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackInbox;
