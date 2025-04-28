import React, { useState, useEffect } from 'react';
import styles from './QuizComponent.module.css';

const QuizComponent = ({ quizQuestions }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    useEffect(() => {
        setAnswers({});
        setSubmitted(false);
        setScore(null);
    }, [quizQuestions]);


    const handleAnswerSelect = (questionId, selectedOption) => {
        if (!submitted && quizQuestions) {
            setAnswers(prevAnswers => ({
                ...prevAnswers,
                [questionId]: selectedOption
            }));
        }
    };

    const handleSubmit = () => {
        if (submitted || !quizQuestions || quizQuestions.length === 0) return;

        let correctAnswersCount = 0;
        quizQuestions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correctAnswersCount++;
            }
        });

        const finalScore = correctAnswersCount;
        setScore(finalScore);

        setSubmitted(true);

        console.log(`Тест по теме завершен. Результат: ${finalScore} из ${quizQuestions.length}`);
    };

    const getOptionClassName = (question, option) => {
        if (!submitted) return styles.optionLabel;

        const originalQuestion = quizQuestions?.find(q => q.id === question.id);
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

    if (!quizQuestions || quizQuestions.length === 0) {
        return <div className={styles.noContent}>Нет вопросов для отображения.</div>;
    }

    return (
        <div className={styles.testContainer}>
            <h2>Тест по теме</h2>

            {!submitted ? (
                quizQuestions.length > 0 ? (
                    <p>Выберите один ответ для каждого вопроса.</p>
                ) : null
            ) : (
                <div className={styles.results}>
                    <h3>Результаты теста</h3>
                    <p>Вы ответили правильно на {score} из {quizQuestions.length} вопросов.</p>
                    {quizQuestions.length > 0 && (
                        <p>Ваш результат: {((score / quizQuestions.length) * 100).toFixed(0)}%</p>
                    )}
                </div>
            )}

            {quizQuestions.length > 0 && (
                <form onSubmit={(e) => e.preventDefault()}>
                    {quizQuestions.map((q /*, index*/) => (
                        <div key={q.id} className={styles.questionBlock}>
                            <p className={styles.questionText}>{q.question}</p>
                            <div className={styles.optionsList}>
                                {q.answers.map((option, index) => (
                                    <label key={index} className={getOptionClassName(q, option)}>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={option}
                                            checked={answers[q.id] === option}
                                            onChange={() => handleAnswerSelect(q.id, option)}
                                            disabled={submitted}
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
                            disabled={Object.keys(answers).length !== quizQuestions.length}
                        >
                            Завершить тест
                        </button>
                    )}

                    {submitted && (
                        <p className={styles.submittedMessage}>Тест завершен. Вы можете просмотреть свои ответы.</p>
                    )}
                </form>
            )}
        </div>
    );
};

export default QuizComponent;
