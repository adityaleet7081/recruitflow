import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            company: null,
            accessToken: null,
            refreshToken: null,
            _hydrated: false,

            setAuth: (user, company, accessToken, refreshToken) =>
                set({ user, company, accessToken, refreshToken }),

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),

            logout: () =>
                set({ user: null, company: null, accessToken: null, refreshToken: null }),

            setHydrated: () => set({ _hydrated: true }),
        }),
        {
            name: 'recruitflow-auth',
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated();
            },
        }
    )
);

export default useAuthStore;