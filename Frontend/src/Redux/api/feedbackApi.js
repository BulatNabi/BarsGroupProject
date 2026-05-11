import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const feedbackApi = createApi({
    reducerPath: 'feedbackApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/feedback',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['MyFeedback'],
    endpoints: (builder) => ({
        submitFeedback: builder.mutation({
            query: ({ subject, message }) => ({
                url: '',
                method: 'POST',
                body: { subject, message },
            }),
            invalidatesTags: ['MyFeedback'],
        }),
        getMyFeedback: builder.query({
            query: () => 'my',
            providesTags: ['MyFeedback'],
        }),
    }),
});

export const {
    useSubmitFeedbackMutation,
    useGetMyFeedbackQuery,
} = feedbackApi;
