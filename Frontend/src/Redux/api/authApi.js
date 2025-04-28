import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
    reducerPath: 'authApi',
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
    tagTypes: ['UserInfo', 'Users'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: 'account/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['UserInfo'],
        }),
        registerAdmin: builder.mutation({
            query: (newAdmin) => ({
                url: 'account/register',
                method: 'POST',
                body: newAdmin,
            }),
            invalidatesTags: ['Users'],
        }),
        getUserInfo: builder.query({
            query: () => ({
                url: `account/userinfo`,
                method: 'GET'
            }),
            providesTags: ['UserInfo'],
        }),
        telegramAuth: builder.mutation({
            query: (initDataString) => ({
                url: `account/telegramAuth`,
                method: 'POST',
                body: JSON.stringify(initDataString),
                headers: {
                    'Content-Type': 'application/json',
                }
            }),
            invalidatesTags: ['UserInfo'],
        }),
        loadPhoto: builder.mutation({
            query: (arg) => ({
                url: `account/loadprofilephoto`,
                method: 'POST',
                body: arg,
            }),
            responseHandler: async (response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    try {
                        const errorBody = await response.json();
                        throw new Error(errorBody.message || JSON.stringify(errorBody));
                    } catch (e) {
                        const errorText = await response.text();
                        throw new Error(errorText || `HTTP error ${response.status}`);
                    }
                }
            },
            invalidatesTags: ['UserInfo'],
        })
    }),
});

export const {
    useLoginMutation,
    useRegisterUserMutation,
    useRegisterAdminMutation,
    useGetUserInfoQuery,
    useTelegramAuthMutation,
    useLoadPhotoMutation
} = authApi;
