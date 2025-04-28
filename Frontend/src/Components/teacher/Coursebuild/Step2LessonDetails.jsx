import React, { useState, useEffect } from 'react';
import styles from '../CoursesBuilderPage.module.css';

const Step2LessonDetails = ({ initialDetails, onDataChange, onNext, onPrev, isSaving }) => {
    const [lessonDetails, setLessonDetails] = useState(initialDetails);

    useEffect(() => {
        setLessonDetails(initialDetails);
    }, [initialDetails]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedDetails = { ...lessonDetails, [name]: value };
        setLessonDetails(updatedDetails);
        onDataChange(updatedDetails);
    };

    const handleNextClick = () => {
        if (!lessonDetails.title.trim()) {
            alert('Пожалуйста, введите название урока.');
            return;
        }
        onNext(lessonDetails);
    };

    return (
        <div>
            <h3>Этап 2: Детали первого урока</h3>
            <p>Заполните название и описание вашего первого урока.</p>

            <div className={styles.formGroup}>
                <label htmlFor="lessonTitle">Название урока</label>
                <input
                    type="text"
                    id="lessonTitle"
                    name="title"
                    value={lessonDetails.title}
                    onChange={handleInputChange}
                    placeholder="Название урока"
                    required
                    disabled={isSaving}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="lessonDescription">Описание урока (опционально)</label>
                <textarea
                    id="lessonDescription"
                    name="description"
                    value={lessonDetails.description}
                    onChange={handleInputChange}
                    placeholder="Краткое описание урока"
                    rows="3"
                    disabled={isSaving}
                />
            </div>

            <div className={styles.navigationButtons}>
                <button onClick={onPrev} className={styles.navButton} disabled={isSaving}>Назад</button>
                <button onClick={handleNextClick} className={styles.navButton} disabled={isSaving}>
                    {isSaving ? 'Создание курса...' : 'Продолжить'}
                </button>
            </div>
        </div>
    );
};

export default Step2LessonDetails;