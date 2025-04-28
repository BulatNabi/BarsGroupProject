import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import TopNavbar from './TopNavbar'; // Убедись, что путь верный

const UserLayout = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole');

    if (!isLoggedIn || role !== 'User') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div>
            <TopNavbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default UserLayout;