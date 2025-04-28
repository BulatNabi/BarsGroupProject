import React from 'react';
import styles from './CoursesGrid.module.css';
import {useNavigate} from "react-router-dom";
import {useGetMyCoursesQuery} from "../../Redux/api/studentApi.js";

const StudentCoursesGrid = () => {
    const navigate = useNavigate();

    const {data: coursesData = [], isLoading: coursesLoading, error: coursesError} = useGetMyCoursesQuery();
    return (
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                {coursesData.map((course, idx) => (
                    <figure className={styles.card} key={idx} onClick={() => navigate(`/courses/${course.id}`)}>
                        <img src={course.previewPhotoKey} alt={`${course.title}`} className={styles.image}/>
                        <figcaption>{course.title}</figcaption>
                        <p className={styles.description}>{course.description}</p>
                    </figure>
                ))}
            </div>
        </div>
    );
};

export default StudentCoursesGrid;
