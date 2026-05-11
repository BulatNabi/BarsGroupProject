import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import { authApi } from '../api/authApi';
import { coursesGetApi } from '../api/coursesApi';
import {testApi} from "../api/testApi.js";
import {studentsApi} from "../api/studentApi.js";
import {lessonApi} from "../api/lessonApi.js";
import { adminApi } from '../api/adminApi.js';
import { feedbackApi } from '../api/feedbackApi.js';
import { notificationsApi } from '../api/notificationsApi.js';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [coursesGetApi.reducerPath]: coursesGetApi.reducer,
        [testApi.reducerPath]: testApi.reducer,
        [studentsApi.reducerPath]: studentsApi.reducer,
        [lessonApi.reducerPath]: lessonApi.reducer,
        [adminApi.reducerPath]: adminApi.reducer,
        [feedbackApi.reducerPath]: feedbackApi.reducer,
        [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(coursesGetApi.middleware)
            .concat(testApi.middleware)
            .concat(studentsApi.middleware)
            .concat(lessonApi.middleware)
            .concat(adminApi.middleware)
            .concat(feedbackApi.middleware)
            .concat(notificationsApi.middleware)
});
