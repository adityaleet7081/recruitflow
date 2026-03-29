import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const hydrated = useAuthStore((s) => s._hydrated);

    // Wait for Zustand to rehydrate from localStorage before deciding
    if (!hydrated) return null;

    if (!accessToken) return <Navigate to="/login" replace />;

    return children;
};

export default ProtectedRoute;