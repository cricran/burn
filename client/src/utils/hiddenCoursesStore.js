import { create } from 'zustand';
import apiRequest from './apiRequest';

const useHiddenCoursesStore = create((set, get) => ({
	hiddenCourses: [],
	isLoading: false,
	error: null,
	showHidden: false,

	loadHiddenCourses: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await apiRequest.get('/hidden-courses');
			set({ hiddenCourses: res.data?.hiddenCourses || [], isLoading: false });
		} catch (e) {
			set({ error: e?.response?.data?.error || 'Erreur lors du chargement', isLoading: false });
		}
	},

	hideCourse: async (courseId) => {
		try {
			const res = await apiRequest.post('/hidden-courses/hide', { courseId });
			set({ hiddenCourses: res.data?.hiddenCourses || [] });
			return { success: true };
		} catch (e) {
			return { success: false, error: e?.response?.data?.error || e.message };
		}
	},

	unhideCourse: async (courseId) => {
		try {
			const res = await apiRequest.post('/hidden-courses/unhide', { courseId });
			set({ hiddenCourses: res.data?.hiddenCourses || [] });
			return { success: true };
		} catch (e) {
			return { success: false, error: e?.response?.data?.error || e.message };
		}
	},

	setShowHidden: (val) => set({ showHidden: !!val }),
}));

export default useHiddenCoursesStore;
