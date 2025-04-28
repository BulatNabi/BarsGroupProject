import React, { useState, useEffect } from 'react';
import styles from './TestThemeInputPage.module.css';
import QuizComponent from './QuizComponent.jsx';
import { useLazyGetQuizQuery } from '../../Redux/api/testApi.js';

const TestThemeInputPage = () => {
    const [theme, setTheme] = useState('');
    const [triggerGetQuiz, { data: quizData, isLoading, error, isSuccess }] = useLazyGetQuizQuery();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (theme.trim()) {
            console.log(`Запрашиваем тест по теме: "${theme}"`);
            triggerGetQuiz(theme.trim());
        }
    };

    useEffect(() => {
        if (isSuccess && quizData) {
            console.log("Тест по теме успешно загружен:", quizData);
        }
        if (error) {
            console.error("Ошибка загрузки теста по теме:", error);
            const errorMsg = error?.data?.message || error?.error || JSON.stringify(error);
            alert(`Не удалось загрузить тест по теме: ${errorMsg}`);
        }
    }, [isSuccess, quizData, error]);

    if (isSuccess && quizData && quizData.length > 0) {
        return <QuizComponent quizQuestions={quizData} />;
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка теста по теме...</div>;
    }

    if (error) {
        const errorMsg = error?.data?.message || error?.error || JSON.stringify(error);
        return <div className={styles.error}>Ошибка: {errorMsg}</div>;
    }

    return (
        <div className={styles.container}>
            <h2>Пройти тест по теме</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="themeInput" className={styles.label}>Введите тему теста:</label>
                    <input
                        type="text"
                        id="themeInput"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className={styles.input}
                        placeholder="Например: Основы React"
                        required
                    />
                </div>
                <button type="submit" className={styles.submitButton}>
                    Начать тест
                </button>
            </form>
            {isSuccess && (!quizData || quizData.length === 0) && (
                <div className={styles.noContentMessage}>
                    Тест по теме "{theme}" не найден. Попробуйте другую тему.
                </div>
            )}
        </div>
    );
};

export default TestThemeInputPage;
