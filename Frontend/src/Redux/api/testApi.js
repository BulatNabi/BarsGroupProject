import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const testApi = createApi({
    reducerPath: 'testApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['LessonTest', 'Quiz'],
    endpoints: (builder) => ({
        createTests: builder.mutation({
            query: ({ lessonId, testsData }) => ({
                url: `tests/lesson/${lessonId}`,
                method: 'POST',
                body: testsData,
            }),
            invalidatesTags: (result, error, { lessonId }) => [{ type: 'LessonTest', id: lessonId }],
        }),
        getLessonTest: builder.query({
            query: (lessonId) => ({
                url: `tests/lesson/${lessonId}`,
                method: 'GET'
            }),
            providesTags: (result, error, lessonId) => [{ type: 'LessonTest', id: lessonId }],
        }),
        submitTestResult: builder.mutation({
            query: ({ lessonId, params }) => ({
                url: `tests/lesson/${lessonId}/submitresult`,
                method: 'POST',
                params: params,
            }),
        }),
        getQuiz: builder.query({
            query: (theme) => ({
                url: `tests/getquiz`,
                method: 'GET',
                params: { theme: theme },
            }),
            providesTags: (result, error, theme) => [{ type: 'Quiz', id: theme }],
        }),
    }),
});

export const { useCreateTestsMutation,
    useGetLessonTestQuery,
    useSubmitTestResultMutation,
    useLazyGetQuizQuery } = testApi;