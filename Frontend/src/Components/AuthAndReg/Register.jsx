import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useRegisterAdminMutation, useRegisterUserMutation} from '../../Redux/api/authApi';
import styles from './AuthForm.module.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [telegramusername, setTelegramUsername] = useState('');

    const [registerAdmin, {isLoading}] = useRegisterAdminMutation();

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !email || !password || !confirmPassword || !telegramusername) {
            setError('Пожалуйста, заполните все поля и выберите роль.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }

        try {
            const newAdmin = {username, telegramusername, email, password};
            await registerAdmin(newAdmin).unwrap();

            navigate('/login');
        } catch (err) {
            console.error('Ошибка регистрации:', err);
            setError('Ошибка регистрации. Возможно, такой email уже зарегистрирован.');
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authForm} onSubmit={handleRegister}>
                <h2>Регистрация</h2>
                <p>Создайте аккаунт</p>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.inputGroup}>
                    <label htmlFor="username">Имя (Username)</label>
                    <input
                        type="text" id="username" placeholder="Ваше имя пользователя"
                        value={username} onChange={(e) => setUsername(e.target.value)} required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="telegramusername">Ник в телеграме</label>
                    <input
                        type="text" id="telegramusername" placeholder="@your_telegram"
                        value={telegramusername} onChange={(e) => setTelegramUsername(e.target.value)} required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email" id="email" placeholder="your@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password" id="password" placeholder="Создайте пароль"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Подтвердите пароль</label>
                    <input
                        type="password" id="confirmPassword" placeholder="Повторите пароль"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>

                <p className={styles.switchForm}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;
