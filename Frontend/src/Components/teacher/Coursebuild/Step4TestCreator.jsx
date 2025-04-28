import React, {useState} from 'react';
import styles from '../CoursesBuilderPage.module.css';

const Step4TestCreator = ({ initialQuestions = [], onPrev, onFinish, isSaving }) => {
    const [questions, setQuestions] = useState(initialQuestions);
    const [currentQuestionText, setCurrentQuestionText] = useState('');
    const [currentAnswers, setCurrentAnswers] = useState([{ id: Date.now(), text: '', isCorrect: false }]);

    const handleQuestionTextChange = (e) => {
        setCurrentQuestionText(e.target.value);
    };

    const handleAddAnswerOption = () => {
        if (currentAnswers.length < 6) {
            setCurrentAnswers([...currentAnswers, { id: Date.now(), text: '', isCorrect: false }]);
        } else {
            alert("Можно добавить не более 6 вариантов ответа.");
        }
    };

    const handleRemoveAnswerOption = (answerIdToRemove) => {
        if (currentAnswers.length > 1) {
            setCurrentAnswers(currentAnswers.filter(answer => answer.id !== answerIdToRemove));
        } else {
            alert("Должен быть хотя бы один вариант ответа.");
        }
    };

    const handleAnswerTextChange = (answerId, newText) => {
        setCurrentAnswers(currentAnswers.map(answer =>
            answer.id === answerId ? { ...answer, text: newText } : answer
        ));
    };

    const handleCorrectAnswerToggle = (answerId) => {
        setCurrentAnswers(currentAnswers.map(answer =>
            answer.id === answerId ? { ...answer, isCorrect: !answer.isCorrect } : answer
        ));
    };

    const handleAddQuestion = () => {
        if (!currentQuestionText.trim()) {
            alert('Пожалуйста, введите текст вопроса.');
            return;
        }
        if (currentAnswers.some(answer => !answer.text.trim())) {
            alert('Пожалуйста, заполните тексты всех вариантов ответа.');
            return;
        }
        if (!currentAnswers.some(answer => answer.isCorrect)) {
            alert('Пожалуйста, отметьте хотя бы один правильный вариант ответа.');
            return;
        }

        const newQuestion = {
            id: Date.now(),
            text: currentQuestionText.trim(),
            answers: currentAnswers.map(a => ({ id: a.id, text: a.text.trim(), isCorrect: a.isCorrect }))
        };

        setQuestions([...questions, newQuestion]);
        setCurrentQuestionText('');
        setCurrentAnswers([{ id: Date.now(), text: '', isCorrect: false }]);
    };

    const handleDeleteQuestion = (questionIdToRemove) => {
        setQuestions(questions.filter(q => q.id !== questionIdToRemove));
    };


    const handleFinishClick = () => {
        if (questions.length === 0) {
            if (!window.confirm("Вы не добавили ни одного вопроса. Завершить создание курса без теста?")) {
                return;
            }
        }
        onFinish(questions);
    };

    return (
        <div>
            <h3>Этап 4: Создание теста</h3>
            <p>Добавьте вопросы и варианты ответа для теста вашего курса.</p>

            <div className={styles.questionList}>
                <h4>Добавленные вопросы ({questions.length}):</h4>
                {questions.length === 0 ? (
                    <p>Пока нет добавленных вопросов.</p>
                ) : (
                    <ul>
                        {questions.map((q, index) => (
                            <li key={q.id} className={styles.questionListItem}>
                                <span>{index + 1}. {q.text} ({q.answers.filter(a=>a.isCorrect).length} прав.)</span>
                                <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className={styles.deleteButton}
                                    title="Удалить вопрос"
                                    disabled={isSaving}
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <hr className={styles.separator} />

            <div className={styles.addQuestionForm}>
                <h4>Добавить новый вопрос:</h4>
                <div className={styles.formGroup}>
                    <label htmlFor="questionText">Текст вопроса:</label>
                    <input
                        type="text"
                        id="questionText"
                        value={currentQuestionText}
                        onChange={handleQuestionTextChange}
                        placeholder="Введите текст вопроса..."
                        className={styles.inputField}
                        disabled={isSaving}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Варианты ответа:</label>
                    {currentAnswers.map((answer, index) => (
                        <div key={answer.id} className={styles.answerOption}>
                            <input
                                type="checkbox"
                                id={`correct_${answer.id}`}
                                checked={answer.isCorrect}
                                onChange={() => handleCorrectAnswerToggle(answer.id)}
                                title="Отметить как правильный"
                                className={styles.checkbox}
                                disabled={isSaving}
                            />
                            <input
                                type="text"
                                value={answer.text}
                                onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                                placeholder={`Вариант ответа ${index + 1}`}
                                className={styles.inputField}
                                style={{ flexGrow: 1, marginRight: '10px' }}
                                disabled={isSaving}
                            />
                            <button
                                onClick={() => handleRemoveAnswerOption(answer.id)}
                                disabled={currentAnswers.length <= 1 || isSaving}
                                className={styles.deleteButton}
                                title="Удалить вариант ответа"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleAddAnswerOption}
                        disabled={currentAnswers.length >= 6 || isSaving}
                        className={styles.addButton}
                        style={{marginTop: '10px'}}
                    >
                        Добавить вариант ответа
                    </button>
                </div>

                <button onClick={handleAddQuestion} className={styles.addButton} disabled={isSaving}>
                    Добавить вопрос в тест
                </button>
            </div>

            <hr className={styles.separator} />

            <div className={styles.navigationButtons}>
                <button onClick={onPrev} className={styles.navButton} disabled={isSaving}>
                    {'<<'}
                </button>
                <button onClick={handleFinishClick} className={styles.navButton} disabled={isSaving}>
                    {isSaving ? 'Создание курса...' : 'Завершить создание'}
                </button>
            </div>
        </div>
    );
};

export default Step4TestCreator;