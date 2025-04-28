// src/components/Teacher/CourseBuilderPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CoursesBuilderPage.module.css';
import Step1CourseDetails from "./Coursebuild/Step1CourseDetails.jsx";
import Step2LessonDetails from "./Coursebuild/Step2LessonDetails.jsx";
import Step3ContentEditor from "./Coursebuild/Step3ContentEditor.jsx";
import Step4TestCreator from "./Coursebuild/Step4TestCreator.jsx";

import { useCreateCourseMutation} from '../../Redux/api/coursesApi';
import { useCreateTestsMutation } from "../../Redux/api/testApi.js";
import {useCreateLessonMutation} from "../../Redux/api/lessonApi.js";

import { useNavigate } from 'react-router-dom';

const CourseBuilderPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    const [courseData, setCourseData] = useState({
        courseName: '',
        courseDescription: '',
        previewImage: null,
        previewImageFile: null,
        imageName: '',
    });

    const [firstLessonDetails, setFirstLessonDetails] = useState({
        title: '',
        description: ''
    });

    const [contentItemsData, setContentItemsData] = useState([]);
    const [testQuestionsData, setTestQuestionsData] = useState([]);

    const [createCourse, {
        isLoading: isCreatingCourse,
        isSuccess: isCourseCreatedSuccess,
        isError: isCreateCourseError,
        error: createCourseError,
        data: courseCreationResult,
        reset: resetCreateCourse
    }] = useCreateCourseMutation();

    const [createLesson, {
        isLoading: isCreatingLesson,
        isSuccess: isLessonCreatedSuccess,
        isError: isCreateLessonError,
        error: createLessonError,
        data: lessonCreationResult,
        reset: resetCreateLesson
    }] = useCreateLessonMutation();

    const [createTests, {
        isLoading: isCreatingTests,
        isSuccess: isTestsCreatedSuccess,
        isError: isCreateTestsError,
        error: createTestsError,
        reset: resetCreateTests
    }] = useCreateTestsMutation();

    const lessonCreationAttemptedRef = useRef(false);
    const testCreationAttemptedRef = useRef(false);


    const isAnySaving = isCreatingCourse || isCreatingLesson || isCreatingTests;
    const isAnyError = isCreateCourseError || isCreateLessonError || isCreateTestsError;

    const anyError = isCreateTestsError ? createTestsError : (isCreateLessonError ? createLessonError : createCourseError);


    const courseDataRef = useRef(courseData);
    useEffect(() => {
        courseDataRef.current = courseData;
    }, [courseData]);

    const resetBuilder = useCallback(() => {
        console.log("Сброс конструктора...");
        setCurrentStep(1);
        setCourseData({ courseName: '', courseDescription: '', previewImage: null, previewImageFile: null, imageName: '' });
        setFirstLessonDetails({ title: '', description: '' });
        setContentItemsData([]);
        setTestQuestionsData([]);
        lessonCreationAttemptedRef.current = false;
        testCreationAttemptedRef.current = false;


        if (typeof resetCreateCourse === 'function') resetCreateCourse();
        if (typeof resetCreateLesson === 'function') resetCreateLesson();
        if (typeof resetCreateTests === 'function') resetCreateTests();

        const currentImage = courseDataRef.current?.previewImage;
        if (currentImage && typeof currentImage === 'string' && currentImage.startsWith('blob:')) {
            URL.revokeObjectURL(currentImage);
            console.log("Отозван URL при сбросе:", currentImage);
        }
    }, [resetCreateCourse, resetCreateLesson, resetCreateTests]);

    useEffect(() => {
        const imageUrl = courseData.previewImage;
        return () => {
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
                console.log("Отозван URL в Effect cleanup:", imageUrl);
            }
        };
    }, [courseData.previewImage]);

    useEffect(() => {
        if (isCourseCreatedSuccess && courseCreationResult?.id && !isCreatingLesson && !lessonCreationAttemptedRef.current) {
            console.log("Effect 2: Курс успешно создан. ID:", courseCreationResult.id, " - Подготовка к созданию урока...");
            lessonCreationAttemptedRef.current = true;

            if (!firstLessonDetails.title || firstLessonDetails.title.trim() === '') {
                console.error("Effect 2: Ошибка: Отсутствуют детали первого урока.");
                alert('Внутренняя ошибка: Не удалось получить данные урока для отправки.');
                return;
            }

            const lessonQueryParams = {
                Name: firstLessonDetails.title,
                ...(firstLessonDetails.description && { Description: firstLessonDetails.description })
            };

            const lessonFormData = new FormData();
            let hasContent = false;

            contentItemsData.forEach(item => {
                if (!item.content) {
                    console.warn(`Элемент контента типа '${item.type}' не содержит содержимого.`);
                    return;
                }

                if (item.type === 'text' && (!item.content || item.content.trim() === '')) {
                    console.warn("Пропускаем пустой текстовый элемент.");
                    return;
                }

                switch (item.type) {
                    case 'text':
                        if (typeof item.content === 'string' && item.content.trim()) {
                            console.log("Добавление текстовой лекции в FormData (TextLectures):", item.content.trim().substring(0, 50) + '...');
                            lessonFormData.append('TextLectures', item.content.trim());
                            hasContent = true;
                        }
                        break;
                    case 'photo':
                        if (item.content instanceof File) {
                            lessonFormData.append('Photos', item.content, item.content.name);
                            hasContent = true;
                        } else {
                            console.warn(`Элемент контента типа 'photo' не содержит File:`, item.content);
                        }
                        break;
                    case 'book':
                        if (item.content instanceof File) {
                            const fileName = item.content.name;
                            const fileExtension = fileName.split('.').pop().toLowerCase();
                            if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(fileExtension)) {
                                lessonFormData.append('Lectures', item.content, item.content.name);
                                hasContent = true;
                            } else {
                                console.warn(`Элемент контента типа 'book' имеет неподдерживаемое расширение файла: ${fileExtension}`);
                            }
                        } else {
                            console.warn(`Элемент контента типа 'book' не содержит File:`, item.content);
                        }
                        break;
                    case 'video':
                        if (item.content instanceof File) {
                            lessonFormData.append('Videos', item.content, item.content.name);
                            hasContent = true;
                        } else {
                            console.warn(`Элемент контента типа 'video' не содержит File:`, item.content);
                        }
                        break;
                    case 'audio':
                        if (item.content instanceof File) {
                            lessonFormData.append('Audios', item.content, item.content.name);
                            hasContent = true;
                        } else {
                            console.warn(`Элемент контента типа 'audio' не содержит File:`, item.content);
                        }
                        break;
                    default:
                        console.warn(`Неизвестный или необработанный тип контента для FormData: ${item.type}`);
                        break;
                }
            });


            console.log("Effect 2: Отправка POST /lessons для курса ID:", courseCreationResult.id);
            console.log("Effect 2: Query Params:", lessonQueryParams);

            console.log("Effect 2: FormData entries:");
            if (hasContent) {
                for (let [key, value] of lessonFormData.entries()) {
                    const displayValue = value instanceof File
                        ? `File: ${value.name} (${value.size} bytes, type: ${value.type})`
                        : (value instanceof Blob ? `Blob: (${value.size} bytes, type: ${value.type})` : value);
                    console.log(`  ${key}:`, displayValue);
                }
            } else {
                console.log("Effect 2: FormData: (empty)");
            }

            createLesson({
                courseId: courseCreationResult.id,
                params: lessonQueryParams,
                lessonData: lessonFormData
            });
        }
        if (isCreateCourseError) {
            console.error('Effect 2: Ошибка создания курса (API error):', createCourseError);
        }

    }, [
        isCourseCreatedSuccess,
        courseCreationResult,
        isCreatingLesson,
        createLesson,
        firstLessonDetails,
        contentItemsData,
        isCreateCourseError,
        createCourseError
    ]);

    useEffect(() => {
        console.log("Effect 3 запущен. Проверка условий для создания тестов...");
        console.log("Effect 3 условия:", {
            isLessonCreatedSuccess: isLessonCreatedSuccess,
            lessonCreationResultId: lessonCreationResult?.id,
            testQuestionsDataExists: !!testQuestionsData,
            testQuestionsDataLength: testQuestionsData?.length,
            isCreatingTests: isCreatingTests,
            testCreationAttempted: testCreationAttemptedRef.current
        });

        if (isLessonCreatedSuccess && lessonCreationResult?.id &&
            testQuestionsData && testQuestionsData.length > 0 &&
            !isCreatingTests &&
            !testCreationAttemptedRef.current
        ) {
            console.log("Effect 3: Условия для создания тестов ВЫПОЛНЕНЫ.");
            console.log("Effect 3: Урок успешно создан. ID:", lessonCreationResult.id, " - Подготовка к созданию тестов...");

            testCreationAttemptedRef.current = true;

            const formattedTestsData = testQuestionsData.map(q => {
                const correctAnswer = q.answers.find(a => a.isCorrect);

                if (!correctAnswer || !correctAnswer.text.trim()) {
                    console.error("Effect 3: Вопрос без правильного ответа или с пустым текстом ответа:", q);
                    return null;
                }

                return {
                    question: q.text.trim(),
                    answers: q.answers.map(a => a.text.trim()),
                    correctAnswer: correctAnswer.text.trim()
                };
            }).filter(q => q !== null);


            if (formattedTestsData.length > 0) {
                console.log("Effect 3: Отправка POST /tests/lesson/...", lessonCreationResult.id);
                console.log("Effect 3: Отправляемое тело запроса для тестов:", formattedTestsData);

                createTests({
                    lessonId: lessonCreationResult.id,
                    testsData: formattedTestsData
                });
                console.log("Effect 3: Мутация createTests ЗАПУЩЕНА.");

            } else {
                console.warn("Effect 3: Все вопросы теста оказались некорректными или пустыми после форматирования. Тесты не будут созданы.");
                alert('Курс и первый урок успешно созданы. Тест не был создан из-за некорректных вопросов.');
                resetBuilder();
            }
        } else {
            console.log("Effect 3: Условия для создания тестов НЕ выполнены.");
        }

        if (isTestsCreatedSuccess) {
            console.log("Effect 3: Тесты успешно созданы!");
            alert('Курс, первый урок и тесты успешно созданы!');
            resetBuilder();
        }

        if (isCreateLessonError) {
            console.error('Effect 3: Ошибка создания урока (API error):', createLessonError);
            const lessonApiError = createLessonError;
            alert(`Ошибка создания урока: ${lessonApiError?.data?.message || lessonApiError?.error || 'Неизвестная ошибка'}`);
        }

        if (isCreateTestsError) {
            console.error('Effect 3: Ошибка создания тестов (API error):', createTestsError);
            const testsApiError = createTestsError;
            console.error('Детали ошибки тестов:', testsApiError?.data);
            alert(`Ошибка создания тестов: ${testsApiError?.data?.title || testsApiError?.data?.message || testsApiError?.error || 'Неизвестная ошибка'}\n\nПодробности: ${JSON.stringify(testsApiError?.data?.errors || 'Нет деталей ошибки.')}`);
        }

        console.log("Effect 3 завершен.");

    }, [
        isLessonCreatedSuccess,
        isTestsCreatedSuccess,
        isCreateLessonError,
        isCreateTestsError,
        lessonCreationResult,
        createTests,
        testQuestionsData,
        resetBuilder,
        createLessonError,
        createTestsError
    ]);

    const handleStep1Complete = () => { setCurrentStep(2); };

    const handleStep2Complete = (lessonDetails) => {
        if (!lessonDetails.title.trim()) {
            alert('Пожалуйста, введите название урока.');
            return;
        }
        setFirstLessonDetails(lessonDetails);
        setCurrentStep(3);
    };

    const handleStep3Complete = (contentItems) => {
        setContentItemsData(contentItems);
        setCurrentStep(4);
    };

    const handleStep4Complete = async (questions) => {
        setTestQuestionsData(questions);

        if (!courseData.courseName || !courseData.courseDescription || !courseData.previewImageFile) {
            alert('Ошибка: Отсутствуют необходимые данные курса (Шаг 1).');
            setCurrentStep(1); return;
        }
        if (!firstLessonDetails.title.trim()) {
            alert('Ошибка: Отсутствует название первого урока (Шаг 2).');
            setCurrentStep(2); return;
        }

        console.log("handleStep4Complete: Сброс состояния мутаций для новой попытки создания...");
        lessonCreationAttemptedRef.current = false;
        testCreationAttemptedRef.current = false;

        if (typeof resetCreateCourse === 'function') resetCreateCourse();
        if (typeof resetCreateLesson === 'function') resetCreateLesson();
        if (typeof resetCreateTests === 'function') resetCreateTests();

        const courseFormData = new FormData();
        courseFormData.append('Title', courseData.courseName);
        courseFormData.append('Description', courseData.courseDescription);
        courseFormData.append('PreviewPhoto', courseData.previewImageFile, courseData.previewImageFile.name);

        console.log("handleStep4Complete: Отправка POST запроса на создание курса...");
        try {
            await createCourse(courseFormData).unwrap();
            console.log("handleStep4Complete: createCourse mutation triggered successfully.");

        } catch (err) {
            console.error("handleStep4Complete: createCourse mutation failed:", err);
        }
    };

    const handlePrevStep = () => {
        if (isAnySaving) return;
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    const renderStep = () => {
        const isStepDisabled = isAnySaving;

        switch (currentStep) {
            case 1: return <Step1CourseDetails courseData={courseData} setCourseData={setCourseData} onNext={handleStep1Complete} isSaving={isStepDisabled} />;
            case 2: return <Step2LessonDetails initialDetails={firstLessonDetails} onDataChange={setFirstLessonDetails} onNext={handleStep2Complete} onPrev={handlePrevStep} isSaving={isStepDisabled} />;
            case 3: return <Step3ContentEditor initialContentItems={contentItemsData} onNext={handleStep3Complete} onPrev={handlePrevStep} isSaving={isStepDisabled} />;
            case 4: return <Step4TestCreator initialQuestions={testQuestionsData} onFinish={handleStep4Complete} onPrev={handlePrevStep} isSaving={isStepDisabled} />;
            default: return <div>Неизвестный шаг</div>;
        }
    };

    const totalSteps = 4;


    return (
        <div className={styles.courseBuilderContainer}>
            <h2>Конструктор курсов</h2>


            {isAnySaving && (
                <div className={styles.loadingOverlay}>
                    {isCreatingCourse ? 'Создание курса...' : isCreatingLesson ? 'Создание первого урока...' : isCreatingTests ? 'Создание тестов...' : 'Сохранение...'}
                </div>
            )}

            {isAnyError && !isAnySaving && (
                <div className={styles.errorMessage}>
                    Ошибка: {anyError?.data?.message || anyError?.error || 'Неизвестная ошибка API'}
                </div>
            )}

            <div className={styles.stepContent}>
                {(!isAnyError || isAnySaving) && renderStep()}
            </div>

            {(currentStep > 1 || courseData.courseName || courseData.courseDescription || courseData.previewImageFile) && !isAnySaving && (
                <button onClick={resetBuilder} className={styles.resetButton} disabled={isAnySaving}>
                    Начать заново
                </button>
            )}
        </div>
    );
};

export default CourseBuilderPage;