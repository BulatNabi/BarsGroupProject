import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import styles from './ChatPage.module.css';

const currentUser = { id: 'user-me', name: 'Вы' };

const placeholderUsers = {
    teacher: [
        { id: 'teacher-1', name: 'Иван Петрович (Преподаватель)' },
    ],
    admin: [
        { id: 'admin-1', name: 'Елена Иванова (Администрация)' },
        { id: 'admin-support', name: 'Тех. Поддержка' },
    ],
    peers: [
        { id: 'peer-1', name: 'Алексей Смирнов' },
        { id: 'peer-2', name: 'Мария Кузнецова' },
        { id: 'user-me', name: 'Вы (Тест)' },
    ]
};

const placeholderMessages = {
    'teacher-1': [
        { id: 'm1', senderId: 'teacher-1', text: 'Здравствуйте! Чем могу помочь?', timestamp: '10:30' },
        { id: 'm2', senderId: currentUser.id, text: 'Добрый день! У меня вопрос по ДЗ.', timestamp: '10:31' },
    ],
    'admin-support': [
        { id: 'm3', senderId: 'admin-support', text: 'Служба поддержки на связи.', timestamp: '11:00' },
    ],
    'peer-1': [
        { id: 'm4', senderId: 'peer-1', text: 'Привет! Ты сделал 3 задание?', timestamp: '12:05' },
        { id: 'm5', senderId: currentUser.id, text: 'Привет, еще нет, разбираюсь.', timestamp: '12:06' },
        { id: 'm6', senderId: 'peer-1', text: 'Сложно?', timestamp: '12:06' },
    ],
};

const ChatPage = (props) => {
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUsers, setChatUsers] = useState(placeholderUsers);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { role } = props;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedChatId) {
            setMessages(placeholderMessages[selectedChatId] || []);
        } else {
            setMessages([]);
        }
    }, [selectedChatId]);

    const handleSelectChat = (userId) => {
        setSelectedChatId(userId);
    };

    const handleBackToChats = () => {
        setSelectedChatId(null);
    };

    const handleSendMessage = (text) => {
        if (!text.trim() || !selectedChatId) return;

        const newMessage = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);

        if (selectedChatId !== 'admin-support' && selectedChatId !== currentUser.id) {
            setTimeout(() => {
                const replyText = `Автоответ на ваше сообщение: "${text.substring(0, 20)}..."`;
                const replyMessage = {
                    id: `msg-${Date.now() + 1}`,
                    senderId: selectedChatId,
                    text: replyText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                if (document.getElementById(`chat-window-${selectedChatId}`)) {
                    setMessages(prevMessages => [...prevMessages, replyMessage]);
                }
            }, 1500);
        }
    };

    const selectedChatName = selectedChatId
        ? Object.values(chatUsers).flat().find(u => u.id === selectedChatId)?.name
        : null;

    return (
        <div>
            <div className={`${styles.chatPageContainer} ${isMobile && selectedChatId ? styles.chatSelectedMobile : ''}`}>
                <ChatSidebar
                    users={chatUsers}
                    selectedChatId={selectedChatId}
                    onSelectChat={handleSelectChat}
                    currentUser={currentUser}
                    className={`${isMobile && selectedChatId ? styles.hideOnMobile : ''}`}
                />
                <ChatWindow
                    key={selectedChatId}
                    chatId={selectedChatId}
                    chatName={selectedChatName}
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                    className={`${isMobile && !selectedChatId ? styles.hideOnMobile : ''}`}
                    onBackToChats={handleBackToChats}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
};

export default ChatPage;
