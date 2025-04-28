import React from 'react';
import styles from '../CoursesBuilderPage.module.css';

const Step1CourseDetails = ({ courseData, setCourseData, onNext, isSaving }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);

            setCourseData(prev => ({
                ...prev,
                previewImage: imageUrl,
                previewImageFile: file,
                imageName: file.name
            }));
            console.log("Изображение выбрано:", file.name, "Blob URL:", imageUrl);
        } else {
            setCourseData(prev => ({
                ...prev,
                previewImage: null,
                previewImageFile: null,
                imageName: ''
            }));
        }
    };

    const handleNextClick = () => {
        if (!courseData.courseName || !courseData.courseDescription || !courseData.previewImageFile) {
            alert('Пожалуйста, заполните все поля и загрузите изображение.');
            return;
        }
        onNext();
    }

    return (
        <div>
            <h3>Этап 1: Детали курса</h3>

            <div className={styles.formGroup}>
                <label htmlFor="courseName">Название курса</label>
                <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={courseData.courseName}
                    onChange={handleInputChange}
                    placeholder="Введите название курса"
                    required
                    disabled={isSaving}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="courseDescription">Описание курса</label>
                <textarea
                    id="courseDescription"
                    name="courseDescription"
                    value={courseData.courseDescription}
                    onChange={handleInputChange}
                    placeholder="Опишите ваш курс"
                    rows="4"
                    required
                    disabled={isSaving}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="coursePreview">Превью курса</label>
                <div className={styles.imageUpload}>
                    {courseData.previewImage ? (
                        <img src={courseData.previewImage} alt="Превью курса" className={styles.previewImage} />
                    ) : (
                        <div className={styles.imagePlaceholder}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.773a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/>
                            </svg>
                            <span>Загрузите изображение для превью курса</span>
                        </div>
                    )}
                    <label className={styles.uploadButton} style={{ pointerEvents: isSaving ? 'none' : 'auto', opacity: isSaving ? 0.6 : 1 }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isSaving}/>
                        {courseData.imageName ? `Изменить (${courseData.imageName})` : 'Загрузить изображение'}
                    </label>
                    {courseData.imageName && !isSaving && (
                        <span className={styles.fileNameDisplay}>{courseData.imageName}</span>
                    )}
                </div>
            </div>

            <div className={styles.navigationButtons} style={{ justifyContent: 'flex-end' }}>
                <button
                    onClick={handleNextClick}
                    className={styles.navButton}
                    disabled={isSaving}
                >
                    {isSaving ? 'Создание курса...' : '>>'}
                </button>
            </div>
        </div>
    );
};

export default Step1CourseDetails;