import React, {useState} from 'react';
import styles from './CourseDetail.module.css';
import adminStyle from './CourseDetailsDisplay.module.css'

import {useUpdateCourseAdminsMutation} from "../../../../Redux/api/coursesApi.js";


const CourseDetailsDisplay = ({course, handleDeleteCourse, isDeletingCourse}) => {
    if (!course) {
        return <div>Загрузка деталей курса...</div>;
    }

    const [adminName, setAdminName] = useState('');
    const [telegramHandle, setTelegramHandle] = useState('');

    const [
        updateCourseAdmins,
        {
            isLoading: isUpdatingAdmins,
            isSuccess: updateAdminsSuccess,
            isError: updateAdminsError,
            error: updateAdminsErrorDetails
        }
    ] = useUpdateCourseAdminsMutation();

    const handleSaveAdminInfo = () => {
        if (!course || !course.id) {
            console.error("Невозможно обновить администраторов: отсутствует ID курса.");
            return;
        }
        const adminInfo = {
            [adminName]: telegramHandle,
        };
        updateCourseAdmins({courseId: course.id, adminInfo});
    };

    const [studentUsernameToDelete, setStudentUsernameToDelete] = useState('');

    return (
        <div className={styles.detailBody}>
            <div className={styles.previewArea}>
                <div className={styles.previewPlaceholder}>
                    {course.previewPhotoKey ? (
                        <img src={course.previewPhotoKey} alt={`Превью курса "${course.title}"`}/>
                    ) : (
                        <p>Нет фото предпросмотра</p>
                    )}
                </div>
            </div>

            <div className={styles.infoArea}>
                <div className={styles.nameAndDescription}>
                    <h4>Название курса</h4>
                    <p>{course.title}</p>
                    <h4>Описание курса</h4>
                    <p>{course.description}</p>
                </div>

                <div className={adminStyle.managementSectionsRow}>
                    <div className={adminStyle.adminInfoSection}>
                        <h4>Добавить/обновить администратора курса</h4>
                        <div>
                            <label htmlFor="adminName">Имя/Идентификатор админа:</label>
                            <input
                                type="text"
                                id="adminName"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Например, IvanIvanov или ID админа"
                            />
                        </div>
                        <div>
                            <label htmlFor="telegramHandle">Ник Телеграма админа:</label>
                            <input
                                type="text"
                                id="telegramHandle"
                                value={telegramHandle}
                                onChange={(e) => setTelegramHandle(e.target.value)}
                                placeholder="@username"
                            />
                        </div>
                        <button
                            className={adminStyle.saveButton}
                            onClick={handleSaveAdminInfo}
                            disabled={isUpdatingAdmins || !adminName || !telegramHandle}
                        >
                            {isUpdatingAdmins ? 'Сохранение...' : 'Сохранить администратора'}
                        </button>

                        {updateAdminsSuccess && <p style={{color: 'green'}}>Администратор сохранен/обновлен успешно!</p>}
                        {updateAdminsError && <p style={{color: 'red'}}>Ошибка
                            сохранения: {updateAdminsErrorDetails?.data?.message || updateAdminsErrorDetails?.message || 'Неизвестная ошибка'}</p>}
                    </div>
                </div>

                <div className={styles.actionButtonsContainer}>
                    <button className={styles.deleteButton} onClick={handleDeleteCourse} disabled={isDeletingCourse}>
                        {isDeletingCourse ? 'Удаление курса...' : 'Удалить курс'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CourseDetailsDisplay;