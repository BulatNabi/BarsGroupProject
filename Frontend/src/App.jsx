import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from "./Components/AuthAndReg/Login.jsx";
import Register from "./Components/AuthAndReg/Register.jsx";
import TeacherDashboard from "./Components/teacher/TeacherDashboard.jsx";
import CourseBuilderPage from "./Components/teacher/CourseBuilderPage.jsx";
import StatisticsPage from "./Components/teacher/StatisticsPage.jsx";
import ChatPage from "./Components/Chat/ChatPage.jsx";
import LessonPage from "./Components/Layout/LessonPage/LessonPage.jsx";
import AdminCourses from "./Components/teacher/Courses/AdminCourses.jsx";
import UserLayout from "./Components/Layout/UserLayout.jsx";
import TeacherLayout from "./Components/teacher/TeacherLayout.jsx";
import ProfilePage from "./Components/Layout/ProfilePage.jsx";
import CoursesGrid from "./Components/Layout/CoursesGrid.jsx";
import StudentCoursesGrid from "./Components/Layout/StudentCoursesGrid.jsx";
import { useTelegramAuthMutation } from "./Redux/api/authApi.js";
import TestThemeInputPage from "./Components/Quiz/TestThemeInputPage.jsx";
import CourseDetail from "./Components/teacher/Courses/CourseDetail/CourseDetail.jsx";

const initData = window.Telegram?.WebApp?.initData || null;

const LoadingScreen = () => {
    return <div>Загрузка приложения...</div>;
};

function App() {
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
    const [isLoading, setIsLoading] = useState(true);

    const location = useLocation();

    const [telegramAuth, {
        isLoading: isAuthLoading,
        isSuccess: isAuthSuccess,
        isError: isAuthError,
        error: authError,
        data: authData
    }] = useTelegramAuthMutation();

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserRole(null);
    };

    useEffect(() => {
        if (initData && !isLoggedIn) {
            telegramAuth(initData);
        } else {
            setIsLoading(false);
        }

        const handleStorageChange = () => {
            const newIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const newUserRole = localStorage.getItem('userRole');
            setIsLoggedIn(newIsLoggedIn);
            setUserRole(newUserRole);
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [telegramAuth]);

    useEffect(() => {
        if (isAuthSuccess && authData) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', authData.role || 'User');
            localStorage.setItem('token', authData.token);

            setIsLoggedIn(true);
            setUserRole(authData.role || 'User');

            setIsLoading(false);
        }
    }, [isAuthSuccess, authData]);

    useEffect(() => {
        if (isAuthError) {
            setIsLoading(false);
        }
    }, [isAuthError, authError]);

    if (isLoading || isAuthLoading) {
        return <LoadingScreen />;
    }

    let targetPath;
    if (isLoggedIn) {
        targetPath = userRole === 'Admin' ? '/teacher' : '/mainwindow';
    } else {
        targetPath = '/register';
    }

    return (
        <Routes>
            {location.pathname === '/' && <Route path="/" element={<Navigate to={targetPath} replace />} />}
            {!isLoggedIn && (
                <>
                    <Route path="/login" element={<Login onLoginSuccess={(role) => { setIsLoggedIn(true); setUserRole(role); }} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/register" replace />} />
                </>
            )}

            {isLoggedIn && userRole === 'Admin' && (
                <Route path="/teacher/*" element={<TeacherLayout handleLogout={handleLogout} />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="builder" element={<CourseBuilderPage />} />
                    <Route path="stats" element={<StatisticsPage />} />
                    <Route path="chat" element={<ChatPage role={userRole} />} />
                    <Route path="mycourses" element={<AdminCourses />} />
                    <Route path="mycourses/detail/:courseId" element={<CourseDetail />} />
                    <Route path="courses/:courseId" element={<LessonPage role={userRole} />} />
                    <Route path="*" element={<Navigate to="/teacher" replace />} />
                </Route>
            )}

            {isLoggedIn && userRole === 'User' && (
                <Route path="/*" element={<UserLayout />}>
                    <Route path="mainwindow" element={<CoursesGrid/>} />
                    <Route path="courses/:courseId" element={<LessonPage role={userRole} />} />
                    <Route path="courses" element={<StudentCoursesGrid/>} />
                    <Route path="chat" element={<ChatPage role={userRole} />} />
                    <Route path="profile" element={<ProfilePage/>}/>
                    <Route path="take-test" element={<TestThemeInputPage />} />
                    <Route path="*" element={<Navigate to="/mainwindow" replace />} />
                </Route>
            )}

            {isLoggedIn && (
                <Route path="*" element={<Navigate to={userRole === 'Admin' ? '/teacher' : '/mainwindow'} replace />} />
            )}

        </Routes>
    );
}

export default App;
