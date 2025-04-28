import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ chatId, chatName, messages, currentUser, onSendMessage, onBackToChats, isMobile }) => {

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleInputChange = (event) => {
        setNewMessage(event.target.value);
    };

    const handleSendClick = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendClick();
        }
    };

    if (!chatId) {
        return (
            <div className={styles.chatWindow}>
                <div className={styles.noChatSelected}>
                    Выберите чат сверху, чтобы начать общение.
                </div>
            </div>
        );
    }

    return (
        <main className={styles.chatWindow} id={`chat-window-${chatId}`}>
            <header className={styles.chatHeader}>
                {isMobile && (
                    <button onClick={onBackToChats} className={styles.backButton}>
                        &lt; Назад
                    </button>
                )}
                <h3>{chatName || 'Чат'}</h3>
            </header>

            <div className={styles.messageList}>
                {messages.length === 0 && (
                    <p className={styles.noMessages}>Сообщений пока нет.</p>
                )}
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`${styles.messageItem} ${msg.senderId === currentUser.id ? styles.sent : styles.received}`}
                    >
                        <div className={styles.messageContent}>
                            <p className={styles.messageText}>{msg.text}</p>
                            <span className={styles.messageTimestamp}>{msg.timestamp}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <footer className={styles.chatInputArea}>
                <textarea
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    rows="2"
                />
                <button onClick={handleSendClick} disabled={!newMessage.trim()}>
                    Отправить
                </button>
            </footer>
        </main>
    );
};

export default ChatWindow;