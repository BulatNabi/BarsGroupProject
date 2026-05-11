import React, { useState } from 'react';
import { useSubmitFeedbackMutation } from '../../Redux/api/feedbackApi.js';
import styles from './FeedbackModal.module.css';

const FeedbackModal = ({ open, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

    if (!open) return null;

    const reset = () => {
        setSubject('');
        setMessage('');
        setSent(false);
    };

    const send = async () => {
        if (!subject.trim() || !message.trim()) return;
        try {
            await submitFeedback({ subject: subject.trim(), message: message.trim() }).unwrap();
            setSent(true);
        } catch (e) {
            alert('Не удалось отправить. Попробуйте ещё раз.');
        }
    };

    const close = () => {
        onClose?.();
        setTimeout(reset, 200);
    };

    return (
        <div className={styles.overlay} onClick={close}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={close} aria-label="Закрыть">×</button>

                {sent ? (
                    <div className={styles.success}>
                        <h3>Сообщение отправлено</h3>
                        <p>Администратор ответит вам в уведомлениях платформы.</p>
                        <button className={styles.primaryButton} onClick={close}>Готово</button>
                    </div>
                ) : (
                    <>
                        <h2 className={styles.title}>Обратная связь</h2>
                        <p className={styles.intro}>
                            Расскажите о проблеме, идее или вопросе. Администратор увидит ваше сообщение
                            и пришлёт ответ в уведомлениях.
                        </p>

                        <label className={styles.label}>Тема</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            maxLength={200}
                            placeholder="Кратко о чём ваше сообщение"
                            className={styles.input}
                        />

                        <label className={styles.label}>Сообщение</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={4000}
                            rows={6}
                            placeholder="Опишите подробнее…"
                            className={styles.textarea}
                        />
                        <span className={styles.counter}>{message.length} / 4000</span>

                        <div className={styles.actions}>
                            <button className={styles.cancelButton} onClick={close}>Отмена</button>
                            <button
                                className={styles.primaryButton}
                                disabled={isLoading || !subject.trim() || !message.trim()}
                                onClick={send}
                            >
                                {isLoading ? 'Отправка…' : 'Отправить'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
