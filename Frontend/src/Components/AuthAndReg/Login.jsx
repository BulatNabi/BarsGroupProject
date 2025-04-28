import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../Redux/api/authApi';
import { setCredentials } from '../../Redux/slices/authSlice';
import styles from './AuthForm.module.css';
import {useState} from "react";

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();

    const handleLogin = async (e) => {

        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Введите email и пароль');
            return;
        }

        try {
            const response = await login({ email, password }).unwrap();
            console.log('login response:', response);

            const tokenPayload = JSON.parse(atob(response.token.split('.')[1]));
            const userRole = tokenPayload.role || 'User';

            dispatch(setCredentials(response));

            localStorage.setItem('token', response.token);
            localStorage.setItem('username', JSON.stringify(response.username));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', userRole);

            alert(`Вы вошли как ${userRole}`);
            if (onLoginSuccess) {
                onLoginSuccess(userRole);
            }

        } catch (err) {
            console.error('Login error:', err);
            setError('Неверный email или пароль');
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authForm} onSubmit={handleLogin}>
                <h2>Вход</h2>
                <p>Войдите в свой аккаунт</p>

                {error && <p className={styles.error}>{error}</p>}

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
                        type="password" id="password" placeholder="Введите ваш пароль"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </div>
    );
};

export default Login;