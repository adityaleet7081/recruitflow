import { useNavigate } from 'react-router-dom';

export default function BillingCancel() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-md">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upgrade cancelled</h2>
                <p className="text-gray-500 text-sm mb-6">
                    No worries! You can upgrade anytime from the billing page.
                </p>
                <button
                    onClick={() => navigate('/billing')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                    Back to billing
                </button>
            </div>
        </div>
    );
}