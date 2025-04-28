import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const lessonApi = createApi({
    reducerPath: 'lessonApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['Lessons', 'Lesson'],
    endpoints: (builder) => ({
        createLesson: builder.mutation({
            query: ({ courseId, params, lessonData }) => ({
                url: `courses/${courseId}/lessons`,
                method: 'POST',
                body: lessonData,
                params: params,
            }),
            invalidatesTags: ['Lessons']
        }),

        getLessons: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}/lessons`,
                method: 'GET'
            }),
            providesTags: ['Lesson'],
        }),
        providesTags: ['Lessons'],
        getSoloLesson: builder.query({
            query: ({ courseId, lessonId }) => ({
                url: `courses/${courseId}/lessons/${lessonId}`,
                method: 'GET',
            }),
            providesTags: ['Lesson']
        }),
        deleteLesson: builder.mutation({
            query: ({ courseId, lessonId }) => ({
                url: `courses/${courseId}/lessons/${lessonId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Lessons']
        }),
    })
});

export const {
    useCreateLessonMutation,
    useGetLessonsQuery,
    useGetSoloLessonQuery,
    useDeleteLessonMutation, } = lessonApi;