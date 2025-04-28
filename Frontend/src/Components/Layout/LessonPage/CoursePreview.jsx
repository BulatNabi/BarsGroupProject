import React from 'react';
import styles from './CoursePreview.module.css';
import { useGetCoursePreviewQuery, useRegisterUserMutation } from "../../../Redux/api/studentApi.js";
import { useParams } from "react-router-dom";

const CoursePreview = (props) => {
    const { courseId } = useParams();

    const { data: courseData = {}, isLoading, error } = useGetCoursePreviewQuery(courseId);
    const [registerUser, { isLoading: isRegistering, error: registerError }] = useRegisterUserMutation();

    const handleEnrollClick = async () => {
        if (!courseId) {
            console.error("No courseId available");
            return;
        }

        try {
            console.log("Attempting to register for course:", courseId);
            const result = await registerUser(courseId).unwrap();
            console.log("Registration successful:", result);
            window.location.reload();
        } catch (error) {
            console.error('Failed to enroll:', error);
        }
    };

    return (
        <div className={styles.coursePreviewContainer}>
            <div className={styles.courseImageContainer}>
                <img src={courseData.previewPhotoKey} alt={courseData.title || 'Изображение курса'} className={styles.courseImage} /> {/* Добавил alt текст по умолчанию */}
            </div>

            <div className={styles.courseInfo}>
                <h2 className={styles.courseName}>{courseData.title}</h2>
                <p className={styles.courseDescription}>{courseData.description}</p>
                {!props.idAdmin && (
                    <button
                        className={styles.enrollButton}
                        onClick={() => handleEnrollClick()}
                        disabled={isLoading || isRegistering}
                    >
                        {isLoading || isRegistering ? 'Запись...' : 'Записаться на курс'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CoursePreview;