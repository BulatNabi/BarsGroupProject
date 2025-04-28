import React, { useState } from 'react';
import styles from './TopNavbar.module.css';
import { Link, useNavigate } from "react-router-dom";
import logo from './logo.jpg';
import profile from './Profile.png';
import { useGetUserInfoQuery } from "../../Redux/api/authApi.js";

const TopNavbar = () => {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();
    const { data: userInfo, isLoading: isLoadingUserInfo, error: userInfoError, refetch: refetchUserInfo } = useGetUserInfoQuery();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    const profileImageSrc = userInfo?.profilePhotoKey || profile;

    return (
        <div className={`${styles.navbar} ${isMenuOpen ? styles.menuOpen : ''}`}>
            <div className={styles.logoSection}>
                <Link to="/mainwindow" className={styles.brand}>Барс Груп</Link>
                <img src={logo} alt="Логотип" className={styles.logo} />
            </div>

            <button className={styles.hamburgerButton} onClick={toggleMenu}>
                {isMenuOpen ? '✕' : '☰'}
            </button>

            <div className={styles.mobileMenuContent}>
                <div className={styles.navLinks} onMouseLeave={() => !isFeedbackModalOpen && setVisibleTooltip(null)}>
                    <Link
                        to="/courses"
                        onMouseEnter={() => !isFeedbackModalOpen && setVisibleTooltip('courses')}
                        className={styles.navLinkItem}
                        onClick={toggleMenu}
                    >
                        Курсы
                    </Link>
                    <Link
                        to="/take-test"
                        onMouseEnter={() => !isFeedbackModalOpen && setVisibleTooltip('test')}
                        className={styles.navLinkItem}
                        onClick={toggleMenu}
                    >
                        Пройти тест
                    </Link>
                    <Link
                        to="/chat"
                        onMouseEnter={() => !isFeedbackModalOpen && setVisibleTooltip('courses')} // Возможно, тут должна быть другая логика тултипа
                        className={styles.navLinkItem}
                        onClick={toggleMenu}
                    >
                        Обратная связь
                    </Link>
                </div>

                <div className={styles.lastpart}>
                    <div className={styles.profileIconContainer} onClick={() => { navigate('/profile'); toggleMenu(); }}>
                        <img src={profileImageSrc} className={styles.profileIcon} alt="User Icon" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopNavbar;
