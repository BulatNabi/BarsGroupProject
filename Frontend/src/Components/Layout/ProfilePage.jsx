
import React, { useState, useEffect } from 'react';
import styles from './ProfilePage.module.css';
import {useGetUserInfoQuery, useLoadPhotoMutation} from "../../Redux/api/authApi.js";;


const ProfilePage = () => {
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const {data: userInfo, isLoading: isLoadingUserInfo, error: userInfoError, refetch: refetchUserInfo} = useGetUserInfoQuery();

    const [
        loadPhoto,
        { isLoading: isUploadingPhoto,
            isSuccess: isPhotoUploadedSuccess,
            isError: isUploadPhotoError,
            error: uploadPhotoErrorDetails
        }
    ] = useLoadPhotoMutation();

    const bestCourse = userInfo?.bestCourse;
    const courseProgresses = userInfo?.courseProgresses || [];
    useEffect(() => {
        console.log("ProfilePage Effect: userInfo изменился", userInfo);
        if (userInfo?.profilePhotoKey) {
            setAvatarPreview(userInfo.profilePhotoKey);
        } else {
            setAvatarPreview('https://via.placeholder.com/150');
        }
    }, [userInfo]);
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setAvatarFile(null);
            setAvatarPreview(userInfo?.profilePhotoKey || 'https://via.placeholder.com/150');
        }
    };

    const handleUploadPhoto = async () => {
        if (!avatarFile) {
            alert("Пожалуйста, выберите файл для загрузки.");
            return;
        }

        const formData = new FormData();
        formData.append('ProfilePhoto', avatarFile, avatarFile.name);

        try {
            console.log("ProfilePage Upload: Отправка фото профиля...", avatarFile.name);
            const result = await loadPhoto(formData).unwrap();

            console.log("ProfilePage Upload: Фото профиля успешно загружено. Результат:", result);
            alert("Фото профиля успешно обновлено!");
            setAvatarFile(null);

        } catch (error) {
            setAvatarFile(null);
            setAvatarPreview(userInfo?.profilePhotoKey || 'https://via.placeholder.com/150');
        }
    };

    if (isLoadingUserInfo) {
        return <div className={styles.loading}>Загрузка профиля...</div>;
    }

    if (!userInfo) {
        return <div className={styles.noContent}>Данные пользователя не найдены или не загружены.</div>;
    }
    return (
        <div className={styles.profileContainer}>
            <h2>Профиль пользователя</h2>

            <div className={styles.avatarSection}>
                <img
                    src={avatarPreview || 'https://via.placeholder.com/150'}
                    alt="Аватар"
                    className={styles.avatar}
                />
                <label className={styles.avatarUpload}>
                    Изменить аватар
                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={isUploadingPhoto} />
                </label>

                {avatarFile && (
                    <p className={styles.selectedFileName}>Выбран файл: {avatarFile.name}</p>
                )}

                {avatarFile && (
                    <button
                        className={styles.saveButton}
                        onClick={handleUploadPhoto}
                        disabled={isUploadingPhoto}
                    >
                        {isUploadingPhoto ? 'Загрузка...' : 'Сохранить фото'}
                    </button>
                )}

            </div>

            <div className={styles.infoSection}>
                <p><strong>Telegram ID:</strong> {userInfo.telegramusername}</p>
                <p><strong>Завершённые курсы:</strong> {userInfo.endedCourses}</p>
                <p>
                    <strong>Лучший результат:</strong>
                    {bestCourse && bestCourse.courseName
                        ? `${bestCourse.courseName} (${bestCourse.completionPercentage || 0}%)`
                        : 'Нет данных о лучшем результате'
                    }
                </p>
            </div>

            <div className={styles.courseProgressSection}>
                <h3>Прогресс по курсам</h3>
                {isLoadingUserInfo ? (
                    <p>Загрузка прогресса...</p>
                ) : courseProgresses.length > 0 ? (
                    courseProgresses.map((course, index) => (
                        <div key={course.courseId || course.courseName || index} className={styles.courseItem}>
                            <p>{course.courseName}</p>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${course.completionPercentage || 0}%` }}
                                >
                                    {course.completionPercentage || 0}%
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Нет данных о прогрессе по курсам.</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
