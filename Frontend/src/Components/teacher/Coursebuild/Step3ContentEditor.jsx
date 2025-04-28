import React, { useState, useRef, useEffect } from 'react';
import styles from '../CoursesBuilderPage.module.css';

const Step3ContentEditor = ({ initialContentItems = [], onNext, onPrev, isSaving }) => {
    const [contentItems, setContentItems] = useState(initialContentItems);
    const [newItem, setNewItem] = useState({ type: 'text', title: '', content: '' });

    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const bookInputRef = useRef(null);
    const audioInputRef = useRef(null);

    useEffect(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (bookInputRef.current) bookInputRef.current.value = '';
        if (audioInputRef.current) audioInputRef.current.value = '';
    }, [contentItems]);

    const addItem = () => {
        if (!newItem.title.trim()) {
            alert('Введите название для этого элемента контента.');
            return;
        }

        if (newItem.type === 'text' && !newItem.content.trim()) {
            alert('Пожалуйста, введите текст лекции.');
            return;
        }

        const isFileType = ['photo', 'video', 'book', 'audio'].includes(newItem.type);
        if (isFileType && !(newItem.content instanceof File)) {
            let fileTypeName = 'файл';
            switch (newItem.type) {
                case 'photo': fileTypeName = 'фотографию или документ'; break;
                case 'video': fileTypeName = 'видеофайл'; break;
                case 'book': fileTypeName = 'файл книги'; break;
                case 'audio': fileTypeName = 'аудиофайл'; break;
                default: break;
            }
            alert(`Пожалуйста, добавьте ${fileTypeName}.`);
            return;
        }

        setContentItems(prev => [...prev, { id: Date.now(), ...newItem }]);
        setNewItem({ type: 'text', title: '', content: '' });
    };

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setNewItem(prev => ({
                ...prev,
                type: type,
                content: file
            }));
            console.log(`Выбран ${type === 'photo' ? 'файл (фото/документ)' : type === 'video' ? 'видео' : type === 'book' ? 'книга' : type === 'audio' ? 'аудио' : 'файл'}: '${file.name}'.`);
        } else {
            setNewItem(prev => ({
                ...prev,
                content: ''
            }));
        }
    };

    const removeItem = (id) => {
        setContentItems(prev => prev.filter(item => item.id !== id));
    };

    const triggerFileInput = (type) => {
        if (isSaving) return;

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (bookInputRef.current) bookInputRef.current.value = '';
        if (audioInputRef.current) audioInputRef.current.value = '';

        setNewItem(prev => ({ ...prev, type: type, content: '' }));

        if (type === 'photo' && fileInputRef.current) {
            fileInputRef.current.click();
        } else if (type === 'video' && videoInputRef.current) {
            videoInputRef.current.click();
        } else if (type === 'book' && bookInputRef.current) {
            bookInputRef.current.click();
        } else if (type === 'audio' && audioInputRef.current) {
            audioInputRef.current.click();
        }
    };

    const handleNextClick = () => {
        if (contentItems.length === 0) {
            if (!window.confirm("Вы не добавили ни одного элемента контента. Продолжить без контента?")) {
                return;
            }
        }
        onNext(contentItems);
    };

    const getDisplayTypeName = (type) => {
        switch (type) {
            case 'text': return 'Текст лекции';
            case 'photo': return 'Фото/Документ';
            case 'video': return 'Видео';
            case 'book': return 'Книга';
            case 'audio': return 'Аудио';
            default: return 'Неизвестный тип';
        }
    };


    return (
        <div>
            <h3>Этап 3: Добавление контента курса</h3>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'photo')}
                disabled={isSaving}
            />
            <input
                type="file"
                ref={videoInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'video')}
                accept="video/*"
                disabled={isSaving}
            />
            <input
                type="file"
                ref={bookInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'book')}
                accept=".epub, .pdf, .fb2, .mobi"
                disabled={isSaving}
            />
            <input
                type="file"
                ref={audioInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'audio')}
                accept="audio/*"
                disabled={isSaving}
            />


            <div className={styles.lectureList}>
                <h4>Добавленные элементы контента ({contentItems.length}):</h4>
                {contentItems.length === 0 && <p>Пока нет добавленных элементов контента.</p>}
                <ul>
                    {contentItems.map((item) => (
                        <li key={item.id}>
                            <span>
                                <strong>{item.title}</strong> ({getDisplayTypeName(item.type)}):{' '}
                                {item.type === 'text'
                                    ? `${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`
                                    : (item.content instanceof File ? item.content.name : 'Ошибка: файл не выбран')
                                }
                            </span>
                            <button onClick={() => removeItem(item.id)} className={styles.removeButton} title="Удалить" disabled={isSaving}>×</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.addLectureForm}>
                <h4>Добавить новый элемент контента:</h4>
                <div className={styles.formGroup}>
                    <label htmlFor="itemTitle">Название</label>
                    <input
                        type="text"
                        id="itemTitle"
                        name="title"
                        value={newItem.title}
                        onChange={handleNewItemChange}
                        placeholder="Название элемента контента (например, Глава 1, Введение, Слайды)"
                        disabled={isSaving}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Тип контента:</label>
                    <div className={styles.contentTypeButtons}>
                        <button
                            type="button"
                            onClick={() => setNewItem(prev => ({ ...prev, type: 'text', content: '' }))}
                            className={`${styles.typeButton} ${newItem.type === 'text' ? styles.activeType : ''}`}
                            disabled={isSaving}
                        >
                            Текст лекции
                        </button>
                        <button
                            type="button"
                            onClick={() => triggerFileInput('photo')}
                            className={`${styles.typeButton} ${newItem.type === 'photo' ? styles.activeType : ''}`}
                            disabled={isSaving}
                        >
                            Фото/Документ
                        </button>
                        <button
                            type="button"
                            onClick={() => triggerFileInput('video')}
                            className={`${styles.typeButton} ${newItem.type === 'video' ? styles.activeType : ''}`}
                            disabled={isSaving}
                        >
                            Видео
                        </button>
                        <button
                            type="button"
                            onClick={() => triggerFileInput('book')}
                            className={`${styles.typeButton} ${newItem.type === 'book' ? styles.activeType : ''}`}
                            disabled={isSaving}
                        >
                            Книга
                        </button>
                        <button
                            type="button"
                            onClick={() => triggerFileInput('audio')}
                            className={`${styles.typeButton} ${newItem.type === 'audio' ? styles.activeType : ''}`}
                            disabled={isSaving}
                        >
                            Аудио файл
                        </button>
                    </div>
                </div>

                {newItem.type === 'text' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="itemContent">Содержание (текст лекции)</label>
                        <textarea
                            id="itemContent"
                            name="content"
                            value={newItem.content}
                            onChange={handleNewItemChange}
                            placeholder="Введите текст лекции..."
                            rows="5"
                            disabled={isSaving}
                        />
                    </div>
                )}
                {['photo', 'video', 'book', 'audio'].includes(newItem.type) && (
                    <div className={styles.formGroup}>
                        <label>{getDisplayTypeName(newItem.type)}:</label>
                        <p className={styles.placeholderContent}>
                            {(newItem.content instanceof File) ? newItem.content.name : `Нажмите кнопку "${getDisplayTypeName(newItem.type)}" выше для выбора.`}
                            {(newItem.content instanceof File) && !isSaving && (
                                <button type="button" onClick={() => triggerFileInput(newItem.type)} className={styles.changePlaceholderButton}>Изменить</button>
                            )}
                        </p>
                    </div>
                )}


                <button type="button" onClick={addItem} className={styles.addButton} disabled={isSaving || !newItem.title.trim() || (newItem.type === 'text' && !newItem.content.trim()) || (['photo', 'video', 'book', 'audio'].includes(newItem.type) && !(newItem.content instanceof File))}>
                    Добавить в список
                </button>
            </div>

            <div className={styles.navigationButtons}>
                <button onClick={onPrev} className={styles.navButton} disabled={isSaving}>
                    {'<<'}
                </button>
                <button onClick={handleNextClick} className={styles.navButton} disabled={isSaving}>
                    {isSaving ? 'Создание курса...' : '>>'}
                </button>
            </div>
        </div>
    );
};

export default Step3ContentEditor;