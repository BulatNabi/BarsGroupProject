
import React, { useState, useEffect } from 'react';
import styles from './TestComponent.module.css';
import { useGetLessonTestQuery, useSubmitTestResultMutation } from '../../Redux/api/testApi.js';

const TestComponent = ({ lessonId, courseId }) => {

    const {
        data: lessonTests,
        isLoading: isLoadingTests,
        error: testsError
    } = useGetLessonTestQuery(lessonId, {
        skip: !lessonId,
    });

    const [submitTestResult, {
        isLoading: isSubmittingResult,
        isSuccess: isResultSubmittedSuccess,
        isError: isSubmitResultError,
        error: submitResultError
    }] = useSubmitTestResultMutation();


    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    useEffect(() => {
        setAnswers({});
        setSubmitted(false);
        setScore(null);
    }, [lessonTests]);

    const handleAnswerSelect = (questionId, selectedOption) => {
        if (!submitted && lessonTests) {
            setAnswers(prevAnswers => ({
                ...prevAnswers,
                [questionId]: selectedOption
            }));
        }
    };

    const testUtils = (question, option) => {
        if (!submitted) return styles.optionLabel;

        const originalQuestion = lessonTests?.find(q => q.id === question.id);
        if (!originalQuestion) return styles.optionLabel;

        const isCorrect = option === originalQuestion.correctAnswer;
        const isSelected = answers[question.id] === option;

        if (isCorrect) {
            return `${styles.optionLabel} ${styles.correct}`;
        }
        if (isSelected && !isCorrect) {
            return `${styles.optionLabel} ${styles.incorrect}`;
        }
        return styles.optionLabel;
    };

    const handleSubmit = async () => {
        if (submitted || !lessonTests || !courseId || !lessonId) return;

        let correctAnswersCount = 0;
        lessonTests.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correctAnswersCount++;
            }
        });

        const finalScore = correctAnswersCount;
        setScore(finalScore);
        setSubmitted(true);

        const resultParams = {
            score: finalScore,
            testid: lessonId,
        };

        submitTestResult({
            lessonId: lessonId,
            params: resultParams
        });
    };

    if (isLoadingTests) {
        return <div className={styles.loading}>Загрузка тестов...</div>;
    }

    if (testsError) {
        const testsErrorMsg = testsError?.data?.message || testsError?.error || 'Неизвестная ошибка'
        return <div className={styles.error}>Ошибка загрузки тестов: {testsErrorMsg}</div>;
    }

    if (!lessonTests || lessonTests.length === 0) {
        return <div className={styles.noContent}>Тесты для этого урока отсутствуют.</div>;
    }

    return (
        <div className={styles.testContainer}>
            <h2>Тестирование по уроку</h2>

            {!submitted ? (
                lessonTests && lessonTests.length > 0 ? (
                    <p>Выберите один ответ для каждого вопроса.</p>
                ) : null
            ) : (
                <div className={styles.results}>
                    <h3>Результаты теста</h3>
                    <p>Вы ответили правильно на {score} из {lessonTests.length} вопросов.</p>
                    {lessonTests.length > 0 && (
                        <p>Ваш результат: {((score / lessonTests.length) * 100).toFixed(0)}%</p>
                    )}
                </div>
            )}

            {lessonTests && lessonTests.length > 0 && (
                <form onSubmit={(e) => e.preventDefault()}>
                    {lessonTests.map((q) => (
                        <div key={q.id} className={styles.questionBlock}>
                            <p className={styles.questionText}>{q.question}</p>
                            <div className={styles.optionsList}>
                                {q.answers.map((option, index) => (
                                    <label key={index} className={testUtils(q, option)}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={option}
                                            checked={answers[q.id] === option}
                                            onChange={() => handleAnswerSelect(q.id, option)}
                                            disabled={submitted} // Отключаем ввод после отправки
                                            className={styles.radioInput}
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    {!submitted && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className={styles.submitButton}
                            disabled={!lessonTests || Object.keys(answers).length !== lessonTests.length || isSubmittingResult}
                        >
                            {isSubmittingResult ? 'Отправка...' : 'Завершить тест'}
                        </button>
                    )}
                    {isSubmittingResult && <p className={styles.submittingMessage}>Отправка результатов...</p>}
                    {isResultSubmittedSuccess && <p className={styles.successMessage}>Результаты успешно отправлены!</p>}
                    {isSubmitResultError && <p className={styles.errorMessage}>Ошибка при отправке результатов.</p>}

                    {submitted && (
                        <p className={styles.submittedMessage}>Тест завершен. Вы можете просмотреть свои ответы.</p>
                    )}
                </form>
            )}
        </div>
    );
};

export default TestComponent;