import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from "./Components/AuthAndReg/Login.jsx";
import Register from "./Components/AuthAndReg/Register.jsx";
import TeacherDashboard from "./Components/teacher/TeacherDashboard.jsx";
import CourseBuilderPage from "./Components/teacher/CourseBuilderPage.jsx";
import StatisticsPage from "./Components/teacher/StatisticsPage.jsx";
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
import AdminLayout from "./Components/admin/AdminLayout.jsx";
import AdminDashboard from "./Components/admin/AdminDashboard.jsx";
import UsersManagement from "./Components/admin/UsersManagement.jsx";
import TeachersManagement from "./Components/admin/TeachersManagement.jsx";
import AllCourses from "./Components/admin/AllCourses.jsx";
import PlatformStatistics from "./Components/admin/PlatformStatistics.jsx";
import FeedbackInbox from "./Components/admin/FeedbackInbox.jsx";

const initData = window.Telegram?.WebApp?.initData || null;

const LoadingScreen = () => (
    <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-2)',
        fontSize: 14,
    }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--glow-primary)',
                animation: 'float-slow 2s ease-in-out infinite',
            }} />
            <span>Загрузка…</span>
        </div>
    </div>
);

const landingFor = (role) => {
    if (role === 'Admin') return '/admin';
    if (role === 'Teacher') return '/teacher';
    return '/mainwindow';
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
        data: authData,
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
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
            setUserRole(localStorage.getItem('userRole'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [telegramAuth]);

    useEffect(() => {
        if (isAuthSuccess && authData) {
            const role = authData.role || 'User';
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('token', authData.token);
            setIsLoggedIn(true);
            setUserRole(role);
            setIsLoading(false);
        }
    }, [isAuthSuccess, authData]);

    useEffect(() => {
        if (isAuthError) setIsLoading(false);
    }, [isAuthError, authError]);

    if (isLoading || isAuthLoading) return <LoadingScreen />;

    const targetPath = isLoggedIn ? landingFor(userRole) : '/register';

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
                <Route path="/admin/*" element={<AdminLayout handleLogout={handleLogout} />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="teachers" element={<TeachersManagement />} />
                    <Route path="courses" element={<AllCourses />} />
                    <Route path="stats" element={<PlatformStatistics />} />
                    <Route path="feedback" element={<FeedbackInbox />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
            )}

            {isLoggedIn && userRole === 'Teacher' && (
                <Route path="/teacher/*" element={<TeacherLayout handleLogout={handleLogout} />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="builder" element={<CourseBuilderPage />} />
                    <Route path="stats" element={<StatisticsPage />} />
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
                    <Route path="profile" element={<ProfilePage/>}/>
                    <Route path="take-test" element={<TestThemeInputPage />} />
                    <Route path="*" element={<Navigate to="/mainwindow" replace />} />
                </Route>
            )}

            {isLoggedIn && (
                <Route path="*" element={<Navigate to={landingFor(userRole)} replace />} />
            )}
        </Routes>
    );
}

export default App;
