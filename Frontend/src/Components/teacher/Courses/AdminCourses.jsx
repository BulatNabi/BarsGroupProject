import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminCourses.module.css';
import { useGetCoursesQuery } from '../../../Redux/api/coursesApi';

const AdminCourses = () => {
    const navigate = useNavigate();
    const {data: coursesDate = [], isLoading, error} = useGetCoursesQuery();

    const handleCreateCourseClick = () => {
        navigate('/teacher/builder');
    };

    const handleCourseClick = (courseId) => {
        navigate(`/teacher/mycourses/detail/${courseId}`);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading courses</div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <h2 className={styles.dashboardTitle}>Мои курсы</h2>
                <button className={styles.createCourseButton} onClick={handleCreateCourseClick}>
                    Создать курс
                </button>
            </div>

            <div className={styles.coursesGrid}>
                {coursesDate.map((course) => (
                    <figure
                        key={course.id}
                        className={styles.card}
                        onClick={() => handleCourseClick(course.id)}
                    >
                        <img src={course.previewPhotoKey} alt={`Курс ${course.title}`} className={styles.image}/>
                        <figcaption>{course.title}</figcaption>
                    </figure>
                ))}
            </div>
        </div>
    );
};

export default AdminCourses;