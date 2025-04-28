import { Outlet } from "react-router-dom";
import TeacherNavbar from "./TeacherNavbar.jsx";
import React from "react";

const TeacherLayout = ({ handleLogout }) => {
    return (
        <div>
            <TeacherNavbar handleLogout={handleLogout} />
            <main><Outlet /></main>
        </div>
    );
};

export default TeacherLayout