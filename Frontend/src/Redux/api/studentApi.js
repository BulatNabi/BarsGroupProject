import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const studentsApi = createApi({
    reducerPath: 'myCoursesGetApi',
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
    tagTypes: ['MyCourses', 'AllCourses', 'Course', 'RegistrationStatus', 'CoursePreview', 'CourseUsers', 'CourseProgress', 'PlatformStats'],
    endpoints: (builder) => ({
        getMyCourses: builder.query({
            query: () => ({
                url: 'courses/mycourses',
                method: 'GET',
            }),
            providesTags: ['MyCourses'],
        }),
        getAllCourses: builder.query({
            query: () => ({
                url: 'courses',
                method: 'GET',
            }),
            providesTags: ['AllCourses'],
        }),
        getCourse: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}`,
                method: 'GET',
            }),
            providesTags: ['Course'],
        }),
        isRegistered: builder.query({
            query: (id) => ({
                url: `courses/${id}/checkregister`,
                method: 'GET',
            }),
            providesTags: ['RegistrationStatus'],
        }),
        getCoursePreview: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}/foruser`,
                method: 'GET',
            }),
            providesTags: ['CoursePreview'],
        }),
        registerUser: builder.mutation({
            query: (courseId) => ({
                url: `courses/register?courseId=${courseId}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }),
            invalidatesTags: ['RegistrationStatus'],
        }),


    })
});

export const { useGetMyCoursesQuery,
    useGetAllCoursesQuery,
    useGetCourseQuery,
    useIsRegisteredQuery,
    useGetCoursePreviewQuery,
    useRegisterUserMutation, } = studentsApi;