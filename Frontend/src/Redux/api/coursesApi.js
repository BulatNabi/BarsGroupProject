import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

export const coursesGetApi = createApi({
    reducerPath: 'coursesGetApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, {getState}) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['Courses', 'Lessons', 'Progress', 'AdminStatus', 'CourseUsers', 'CourseProgress', 'PlatformStats', 'AdminCourseProgress', 'CourseAdminStatus'],
    endpoints: (builder) => ({
        getCourses: builder.query({
            query: () => ({
                url: 'courses/mycourses',
                method: 'GET',
            }),
            providesTags: ['Courses'],
        }),
        createCourse: builder.mutation({
            query: (courseData) => ({
                url: 'courses',
                method: 'POST',
                body: courseData,
            }),
            invalidatesTags: ['Courses', 'AdminCourseProgress'],
        }),
        getUsers: builder.query({
            query: (id) => ({
                url: `courses/${id}/users`,
                method: 'GET'
            }),
            providesTags: ['Courses'],
        }),
        getPlatformProgress: builder.query({
            query: () => ({
                url: `courses/platformprogress`,
                method: 'GET',
            }),
            providesTags: ['PlatformStats']
        }),
        getCourseProgress: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}/allusersprogress`,
                method: 'GET',
            }),
            providesTags: (result, error, courseId) => [{ type: 'CourseProgress', id: courseId }],
        }),
        deleteCourse: builder.mutation({
            query: (courseId) =>({
                url: `courses/${courseId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Courses', 'AdminCourseProgress'],
        }),
        getAdminCoursesProgress: builder.query({
           query: () => ({
               url: `courses/admincoursesprogress`,
               method: 'GET',
           }),
            providesTags: ['AdminCourseProgress'],
        }),
        isAdminOfCourse: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}/checkadmin`,
                method: 'GET',
            }),
            providesTags: (result, error, courseId) => [{ type: 'CourseAdminStatus', id: courseId }],
        }),
        downloadCourseProgress: builder.query({
            query: (courseId) => ({
                url: `courses/${courseId}/usersprogress/download`,
                method: 'GET',
                responseHandler: async (response) => {
                    if (!response.ok) {
                        try {
                            const errorBody = await response.json();
                            throw new Error(`HTTP error ${response.status}: ${errorBody.message || JSON.stringify(errorBody)}`);
                        } catch (e) {
                            const errorText = await response.text();
                            throw new Error(`HTTP error ${response.status}: ${errorText}`);
                        }
                    }
                    return response.text();
                },
            }),
        }),
        updateCourseAdmins: builder.mutation({
            query: ({ courseId, adminInfo }) => ({
                url: `courses/${courseId}/updateadmins`,
                method: 'POST',
                body: adminInfo,
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'Courses', id: courseId }],
        }),
        deleteUser: builder.mutation({
            query: ({courseId, telegramUsername}) => ({
                url: `courses/unregister`,
                method: 'DELETE',
                params: { courseId, telegramUsername },
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseProgress', id: courseId }, 'RegistrationStatus'],
        }),
    })
});

export const { useGetCoursesQuery,
    useCreateCourseMutation,
    useGetPlatformProgressQuery,
    useGetCourseProgressQuery,
    useDeleteCourseMutation,
    useGetAdminCoursesProgressQuery,
    useIsAdminOfCourseQuery,
    useLazyDownloadCourseProgressQuery,
    useUpdateCourseAdminsMutation,
    useDeleteUserMutation} = coursesGetApi;