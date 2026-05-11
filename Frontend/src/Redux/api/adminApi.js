import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const adminApi = createApi({
    reducerPath: 'adminApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/admin',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['Users', 'User', 'Teachers', 'Courses', 'Stats', 'Feedback'],
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: ({ search, role, page = 1, pageSize = 50 } = {}) => {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (role) params.set('role', role);
                params.set('page', page);
                params.set('pageSize', pageSize);
                return `users?${params.toString()}`;
            },
            providesTags: ['Users'],
        }),
        getUser: builder.query({
            query: (id) => `users/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'User', id }],
        }),
        changeRole: builder.mutation({
            query: ({ id, role }) => ({
                url: `users/${id}/role`,
                method: 'PATCH',
                body: { role },
            }),
            invalidatesTags: (_r, _e, { id }) => ['Users', 'Teachers', 'Stats', { type: 'User', id }],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({ url: `users/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Users', 'Teachers', 'Stats'],
        }),
        getTeachers: builder.query({
            query: () => 'teachers',
            providesTags: ['Teachers'],
        }),
        getAllCourses: builder.query({
            query: () => 'courses',
            providesTags: ['Courses'],
        }),
        getOverviewStats: builder.query({
            query: () => 'stats/overview',
            providesTags: ['Stats'],
        }),
        getCourseStats: builder.query({
            query: () => 'stats/courses',
            providesTags: ['Stats'],
        }),
        getTimeseries: builder.query({
            query: ({ metric = 'enrollments', days = 30 } = {}) => `stats/timeseries?metric=${metric}&days=${days}`,
            providesTags: ['Stats'],
        }),
        blockUser: builder.mutation({
            query: ({ id, reason }) => ({
                url: `users/${id}/block`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (_r, _e, { id }) => ['Users', { type: 'User', id }],
        }),
        unblockUser: builder.mutation({
            query: (id) => ({ url: `users/${id}/unblock`, method: 'POST' }),
            invalidatesTags: (_r, _e, id) => ['Users', { type: 'User', id }],
        }),
        getFeedback: builder.query({
            query: (status) => status ? `feedback?status=${encodeURIComponent(status)}` : 'feedback',
            providesTags: ['Feedback'],
        }),
        replyFeedback: builder.mutation({
            query: ({ id, reply, status }) => ({
                url: `feedback/${id}`,
                method: 'PATCH',
                body: { reply, status },
            }),
            invalidatesTags: ['Feedback'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserQuery,
    useChangeRoleMutation,
    useDeleteUserMutation,
    useGetTeachersQuery,
    useGetAllCoursesQuery,
    useGetOverviewStatsQuery,
    useGetCourseStatsQuery,
    useGetTimeseriesQuery,
    useBlockUserMutation,
    useUnblockUserMutation,
    useGetFeedbackQuery,
    useReplyFeedbackMutation,
} = adminApi;
