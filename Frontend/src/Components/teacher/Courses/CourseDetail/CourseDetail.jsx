import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CourseDetail.module.css';

import {
    useGetCoursesQuery,
    useGetCourseProgressQuery,
    useDeleteCourseMutation,
} from "../../../../Redux/api/coursesApi.js";
import { useGetLessonsQuery } from "../../../../Redux/api/lessonApi.js";

import Step2LessonDetails from "../../Coursebuild/Step2LessonDetails.jsx";
import Step3ContentEditor from "../../Coursebuild/Step3ContentEditor.jsx";
import Step4TestCreator from "../../Coursebuild/Step4TestCreator.jsx";
import CourseDetailsDisplay from './CourseDetailsDisplay.jsx';
import CourseLessonsSection from './CourseLessonsSection.jsx';
import CourseProgressTable from './CourseProgressTable.jsx';
import useAddLessonWorkflow from "./hooks.jsx";


const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('details');

    const { data: coursesData = [], isLoading: coursesLoading, error: coursesError } = useGetCoursesQuery();
    const { data: lessonsData = [], isLoading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = useGetLessonsQuery(courseId, { skip: !courseId });
    const { data: courseProgressData = [], isLoading: courseProgressLoading, error: courseProgressError } = useGetCourseProgressQuery(courseId, { skip: !courseId });

    const [deleteCourse, { isLoading: isDeletingCourse, error: deleteCourseError }] = useDeleteCourseMutation();

    const {
        addLessonStep,
        newLessonDetails,
        setNewLessonDetails,
        newContentItemsData,
        setNewContentItemsData,
        newTestQuestionsData,
        setNewTestQuestionsData,
        isSaving: isAddingLessonOrTests,
        saveError: addLessonSaveError,
        handleNextStep: handleNextAddLessonStep,
        handlePrevStep: handlePrevAddLessonStep,
        handleSubmit: handleSubmitLessonWorkflow,
        resetWorkflow: resetAddLessonWorkflow,
    } = useAddLessonWorkflow(courseId, refetchLessons, () => setViewMode('details'));

    useEffect(() => {
        if (coursesData && coursesData.length > 0) {
            const foundCourse = coursesData.find(c => c.id === parseInt(courseId));

            if (foundCourse) {
                setCourse(foundCourse);
                setLoading(false);
            } else {
                console.warn(`Курс с ID ${courseId} не найден. Перенаправление.`);
                navigate('/teacher/mycourses', { replace: true });
            }
        } else if (!coursesLoading && !coursesError) {
            setLoading(false);
            console.warn("Данные курсов не загружены или список пуст. Перенаправление.");
            navigate('/teacher/mycourses', { replace: true });
        } else if (coursesError) {
            setLoading(false);
            console.error("Ошибка загрузки данных курсов:", coursesError);
        }
    }, [courseId, navigate, coursesData, coursesLoading, coursesError]);

    const handleLessonClick = (lessonId) => {
        navigate(`/teacher/courses/${courseId}`);
    };

    const handleDeleteCourse = async () => {
        if (!courseId) {
            console.error("Невозможно удалить: отсутствует ID курса.");
            alert("Невозможно удалить курс: отсутствует идентификатор.");
            return;
        }

        const isConfirmed = window.confirm(`Вы уверены, что хотите удалить курс "${course?.name || 'без названия'}"?`);

        if (!isConfirmed) {
            return;
        }

        try {
            await deleteCourse(courseId).unwrap();
            navigate("/teacher/mycourses");
        } catch (error) {
            console.error("Ошибка при удалении курса:", error);
            const deleteErrorMsg = error?.data?.message || error?.error || 'Неизвестная ошибка при удалении';
            alert(`Не удалось удалить курс: ${deleteErrorMsg}`);
        }
    };

    const handleAddLessonClick = () => {
        resetAddLessonWorkflow();
        setViewMode('add-lesson');
    };

    const handleCancelAddLesson = () => {
        if (isAddingLessonOrTests) {
            alert('Дождитесь завершения сохранения.');
            return;
        }

        if (window.confirm('Вы уверены, что хотите отменить добавление урока? Введенные данные будут потеряны.')) {
            resetAddLessonWorkflow();
            setViewMode('details');
        }
    };

    if (loading || coursesLoading) {
        return <div className={styles.loading}>Загрузка данных курса...</div>;
    }

    if (coursesError && !course) {
        const courseErr = coursesError?.data?.message || coursesError?.error || 'Неизвестная ошибка';
        return <div className={styles.error}>Ошибка загрузки курсов: {courseErr}</div>;
    }

    if (!course) {
        return <div className={styles.noContent}>Курс не найден.</div>;
    }

    if (viewMode === 'add-lesson') {
        const isStepDisabled = isAddingLessonOrTests;

        return (
            <div className={styles.courseDetailAddLesson}>
                <h3>Добавление нового урока к курсу "{course.name}"</h3>

                {isAddingLessonOrTests && (
                    <div className={styles.loadingOverlay}>
                        Сохранение урока и тестов...
                    </div>
                )}

                {addLessonSaveError && !isAddingLessonOrTests && (
                    <div className={styles.errorMessage}>
                        Ошибка сохранения: {addLessonSaveError?.data?.message || addLessonSaveError?.error || 'Неизвестная ошибка API'}
                        {addLessonSaveError?.data?.errors && (
                            <pre className={styles.validationErrors}>
                                 {JSON.stringify(addLessonSaveError.data.errors, null, 2)}
                             </pre>
                        )}
                    </div>
                )}

                {addLessonStep === 2 && (
                    <Step2LessonDetails
                        initialDetails={newLessonDetails}
                        onDataChange={setNewLessonDetails}
                        onNext={handleNextAddLessonStep}
                        onPrev={handlePrevAddLessonStep}
                        isSaving={isStepDisabled}
                    />
                )}
                {addLessonStep === 3 && (
                    <Step3ContentEditor
                        initialContentItems={newContentItemsData}
                        onDataChange={setNewContentItemsData}
                        onNext={handleNextAddLessonStep}
                        onPrev={handlePrevAddLessonStep}
                        isSaving={isStepDisabled}
                    />
                )}
                {addLessonStep === 4 && (
                    <Step4TestCreator
                        initialQuestions={newTestQuestionsData}
                        onDataChange={setNewTestQuestionsData}
                        onFinish={handleSubmitLessonWorkflow}
                        onPrev={handlePrevAddLessonStep}
                        isSaving={isStepDisabled}
                    />
                )}

                <button
                    onClick={handleCancelAddLesson}
                    className={styles.cancelButton}
                    disabled={isAddingLessonOrTests}
                >
                    Отменить добавление урока
                </button>

            </div>
        );
    }

    return (
        <div className={styles.courseDetailPage}>
            <div className={styles.courseDetailContainer}>
                <CourseDetailsDisplay
                    course={course}
                    handleDeleteCourse={handleDeleteCourse}
                    isDeletingCourse={isDeletingCourse}
                />

                <CourseLessonsSection
                    lessonsData={lessonsData}
                    lessonsLoading={lessonsLoading}
                    lessonsError={lessonsError}
                    handleAddLessonClick={handleAddLessonClick}
                    handleLessonClick={handleLessonClick}
                />

                <CourseProgressTable
                    courseProgressData={courseProgressData}
                    courseProgressLoading={courseProgressLoading}
                    courseProgressError={courseProgressError}
                    lessonsData={lessonsData}
                />
            </div>
        </div>
    );
};

export default CourseDetail;
