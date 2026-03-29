import { useNavigate } from 'react-router-dom';

export default function BillingSuccess() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-md">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Pro!</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Your account has been upgraded. Enjoy unlimited jobs and AI scoring.
                </p>
                <button
                    onClick={() => navigate('/jobs')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                    Go to dashboard
                </button>
            </div>
        </div>
    );
}