import React from 'react';
import styles from './ChatSidebar.module.css';

const ChatSidebar = ({ users, selectedChatId, onSelectChat, currentUser, className }) => {
    return (
        <aside className={`${styles.sidebar} ${className}`}>
            <h3>Чаты</h3>
            {users.teacher?.length > 0 && (
                <div className={styles.userSection}>
                    <h4>Преподаватели</h4>
                    <ul className={styles.userList}>
                        {users.teacher.map(user => (
                            <li
                                key={user.id}
                                className={`${styles.userItem} ${selectedChatId === user.id ? styles.selected : ''}`}
                                onClick={() => onSelectChat(user.id)}
                            >
                                {user.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {users.admin?.length > 0 && (
                <div className={styles.userSection}>
                    <h4>Администрация</h4>
                    <ul className={styles.userList}>
                        {users.admin.map(user => (
                            <li
                                key={user.id}
                                className={`${styles.userItem} ${selectedChatId === user.id ? styles.selected : ''}`}
                                onClick={() => onSelectChat(user.id)}
                            >
                                {user.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {users.peers?.length > 0 && (
                <div className={styles.userSection}>
                    <h4>Участники курса</h4>
                    <ul className={styles.userList}>
                        {users.peers
                            .filter(user => user.id !== currentUser.id)
                            .map(user => (
                                <li
                                    key={user.id}
                                    className={`${styles.userItem} ${selectedChatId === user.id ? styles.selected : ''}`}
                                    onClick={() => onSelectChat(user.id)}
                                >
                                    {user.name}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </aside>
    );
};

export default ChatSidebar;
