import React, { useState } from 'react';
import { Link, Outlet, useLocation, NavLink } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const navLinks = [
    { to: '/admin', end: true, label: 'Дашборд' },
    { to: '/admin/users', label: 'Пользователи' },
    { to: '/admin/teachers', label: 'Преподаватели' },
    { to: '/admin/courses', label: 'Курсы' },
    { to: '/admin/stats', label: 'Статистика' },
    { to: '/admin/feedback', label: 'Обратная связь' },
];

const AdminLayout = ({ handleLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <div>
            <div className={`${styles.navbar} ${isMenuOpen ? styles.menuOpen : ''}`}>
                <div className={styles.logoSection}>
                    <Link to="/admin" className={styles.brand}>Барс Груп · Админ</Link>
                </div>

                <button
                    className={styles.mobileMenuToggle}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                <div className={`${styles.navLinks} ${isMenuOpen ? styles.open : ''}`}>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                `${styles.navLinkItem} ${isActive ? styles.active : ''}`
                            }
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className={styles.authButtons}>
                    <button onClick={handleLogout} className={styles.logoutButton}>Выйти</button>
                </div>
            </div>

            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
