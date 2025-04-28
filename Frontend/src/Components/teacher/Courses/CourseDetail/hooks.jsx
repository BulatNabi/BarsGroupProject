import { useState } from 'react';
import { useCreateLessonMutation } from '../../../../Redux/api/lessonApi.js';
import { useCreateTestsMutation } from '../../../../Redux/api/testApi.js';

const useAddLessonWorkflow = (courseId, refetchLessons, onSuccessfulSubmit) => {
    const [addLessonStep, setAddLessonStep] = useState(2);
    const [newLessonDetails, setNewLessonDetails] = useState({ title: '', description: '' });
    const [newContentItemsData, setNewContentItemsData] = useState([]);
    const [newTestQuestionsData, setNewTestQuestionsData] = useState([]);

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

    const isSaving = isCreatingLesson || isCreatingTests;
    const saveError = isCreateLessonError ? createLessonError : (isCreateTestsError ? createTestsError : null);


    const handleNextStep = (data) => {
        if (isSaving) return;

        if (addLessonStep === 2) {
            if (!data.title.trim()) {
                console.warn('Ошибка: Не введено название урока.');
                alert('Пожалуйста, введите название урока.');
                return;
            }
            setNewLessonDetails(data);
            setAddLessonStep(3);
        } else if (addLessonStep === 3) {
            setNewContentItemsData(data);
            setAddLessonStep(4);
        }
    };

    const handlePrevStep = () => {
        if (isSaving) return;
        setAddLessonStep(prev => Math.max(2, prev - 1));
    };

    const resetWorkflow = () => {
        setAddLessonStep(2);
        setNewLessonDetails({ title: '', description: '' });
        setNewContentItemsData([]);
        setNewTestQuestionsData([]);
        if (typeof resetCreateLesson === 'function') resetCreateLesson();
        if (typeof resetCreateTests === 'function') resetCreateTests();
    };

    const handleSubmit = async (questions) => {
        setNewTestQuestionsData(questions);

        if (!newLessonDetails.title.trim()) {
            console.error('Ошибка при отправке: Отсутствует название урока (Шаг 2).');
            alert('Ошибка: Отсутствует название урока (Шаг 2). Пожалуйста, вернитесь и заполните.');
            setAddLessonStep(2);
            return;
        }

        if (typeof resetCreateLesson === 'function') resetCreateLesson();
        if (typeof resetCreateTests === 'function') resetTests();

        const lessonFormData = new FormData();
        const lessonQueryParams = {
            Name: newLessonDetails.title,
            ...(newLessonDetails.description && { Description: newLessonDetails.description })
        };

        newContentItemsData.forEach(item => {
            if (!item.content) { console.warn(`Пропускаем элемент контента типа '${item.type}' без содержимого.`); return; }
            if (item.type === 'text' && (!item.content || item.content.trim() === '')) { console.warn("Пропускаем пустой текстовый элемент."); return; }
            switch (item.type) {
                case 'text': if (typeof item.content === 'string' && item.content.trim()) { lessonFormData.append('TextLectures', item.content.trim()); } break;
                case 'photo': if (item.content instanceof File) { lessonFormData.append('Photos', item.content, item.content.name); } else { console.warn(`Тип photo ожидает File, получен:`, item.content); } break;
                case 'book': if (item.content instanceof File) { const fileName = item.content.name; const fileExtension = fileName.split('.').pop().toLowerCase(); if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(fileExtension)) { lessonFormData.append('Lectures', item.content, item.content.name); } else { console.warn(`Тип book имеет неподдерживаемое расширение: ${fileExtension}`); } } else { console.warn(`Тип book ожидает File, получен:`, item.content); } break;
                case 'video': if (item.content instanceof File) { lessonFormData.append('Videos', item.content, item.content.name); } else { console.warn(`Тип video ожидает File, получен:`, item.content); } break;
                case 'audio': if (item.content instanceof File) { lessonFormData.append('Audios', item.content, item.content.name); } else { console.warn(`Тип audio ожидает File, получен:`, item.content); } break;
                default: console.warn(`Неизвестный или необработанный тип контента для FormData: ${item.type}`); break;
            }
        });

        try {
            const lessonResult = await createLesson({
                courseId: courseId,
                params: lessonQueryParams,
                lessonData: lessonFormData
            }).unwrap();

            const shouldCreateTests = !!lessonResult?.id && Array.isArray(questions) && questions.length > 0;

            if (shouldCreateTests) {
                const formattedTestsData = questions.map(q => {
                    if (!q.text || !q.text.trim() || !Array.isArray(q.answers) || q.answers.length === 0) {
                        console.warn("Пропускаем некорректный вопрос без текста или вариантов:", q);
                        return null;
                    }

                    const correctAnswer = q.answers.find(a => a.isCorrect);
                    if (!correctAnswer || !correctAnswer.text || !correctAnswer.text.trim()) {
                        console.warn("Пропускаем вопрос без правильного ответа или с пустым текстом правильного ответа:", q);
                        return null;
                    }

                    const hasEmptyAnswerText = q.answers.some(a => !a.text || !a.text.trim());
                    if (hasEmptyAnswerText) {
                        console.warn("Пропускаем вопрос с пустым текстом одного из вариантов ответа:", q);
                        return null;
                    }


                    return {
                        question: q.text.trim(),
                        answers: q.answers.map(a => a.text.trim()),
                        correctAnswer: correctAnswer.text.trim()
                    };
                }).filter(q => q !== null);

                if (formattedTestsData.length > 0) {
                    await createTests({
                        lessonId: lessonResult.id,
                        testsData: formattedTestsData
                    }).unwrap();
                    alert('Новый урок и тесты успешно добавлены в курс!');

                } else {
                    alert('Новый урок добавлен в курс. Тесты не были созданы из-за некорректных вопросов.');
                }
            } else {
                alert('Новый урок успешно добавлен в курс!');
            }
            if (refetchLessons) {
                refetchLessons();
            }
            if (onSuccessfulSubmit) {
                onSuccessfulSubmit();
            }

            resetWorkflow();

        } catch (err) {
            console.error("Ошибка при создании урока или тестов:", err);
            const apiError = err;
            alert(`Ошибка при добавлении урока или тестов: ${apiError?.data?.message || apiError?.error || 'Неизвестная ошибка'}`);
        }
    };
    const resetTests = () => {
        if (typeof resetCreateTests === 'function') resetCreateTests();
    };


    return {
        addLessonStep,
        newLessonDetails,
        newContentItemsData,
        newTestQuestionsData,
        isSaving,
        saveError,
        handleNextStep,
        handlePrevStep,
        handleSubmit,
        resetWorkflow,
    };
};

export default useAddLessonWorkflow;