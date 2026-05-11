import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationsApi = createApi({
    reducerPath: 'notificationsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/notifications',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['Notifications', 'UnreadCount'],
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: (unreadOnly = false) => `?unreadOnly=${unreadOnly}`,
            providesTags: ['Notifications'],
        }),
        getUnreadCount: builder.query({
            query: () => 'unread-count',
            providesTags: ['UnreadCount'],
        }),
        markRead: builder.mutation({
            query: (id) => ({ url: `${id}/read`, method: 'POST' }),
            invalidatesTags: ['Notifications', 'UnreadCount'],
        }),
        markAllRead: builder.mutation({
            query: () => ({ url: 'read-all', method: 'POST' }),
            invalidatesTags: ['Notifications', 'UnreadCount'],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkReadMutation,
    useMarkAllReadMutation,
} = notificationsApi;
