import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAPI } from '../../api/auth';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await loginAPI(form);
            const { user, company, accessToken, refreshToken } = res.data;
            setAuth(user, company, accessToken, refreshToken);
            navigate('/dashboard/jobs');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: '#080a14', fontFamily: "'DM Sans', sans-serif",
        }}>
            {/* Left panel */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '60px',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Orb */}
                <div style={{
                    position: 'absolute', top: '20%', left: '10%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }} />

                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 800, color: '#fff',
                    }}>R</div>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.3px' }}>RecruitFlow</span>
                </Link>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 42, fontWeight: 400, color: '#fff',
                        letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16,
                    }}>
                        Your next great hire<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>starts here.</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
                        AI scores every resume. Your pipeline runs itself. You focus on the people that matter.
                    </p>

                    {[
                        { icon: '🤖', text: 'AI resume scoring in seconds' },
                        { icon: '🎯', text: 'Visual drag-and-drop pipeline' },
                        { icon: '📊', text: 'Hiring analytics dashboard' },
                    ].map(({ icon, text }) => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                            }}>{icon}</div>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{
                width: 480, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '60px 48px',
            }}>
                <div style={{ marginBottom: 40 }}>
                    <h1 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 32, fontWeight: 400, color: '#fff',
                        letterSpacing: '-1px', marginBottom: 8,
                    }}>Welcome back</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                        Sign in to your RecruitFlow workspace
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                        color: '#fca5a5', fontSize: 14,
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {[
                        { label: 'Email address', key: 'email', type: 'email', placeholder: 'you@company.com' },
                        { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key} style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.6)',
                                fontSize: 13, fontWeight: 500, marginBottom: 8,
                            }}>{label}</label>
                            <input
                                type={type}
                                value={form[key]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                placeholder={placeholder}
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, padding: '12px 16px',
                                    color: '#fff', fontSize: 14,
                                    outline: 'none', transition: 'border-color 0.2s',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px',
                            background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                            border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                            color: '#fff', fontSize: 15, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            marginTop: 8,
                        }}
                        onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 12px 32px rgba(245,158,11,0.45)'; } }}
                        onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; }}
                    >
                        {loading ? 'Signing in...' : 'Sign in →'}
                    </button>
                </form>

                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginTop: 28, textAlign: 'center' }}>
                    No account?{' '}
                    <Link to="/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>
                        Create your workspace
                    </Link>
                </p>
            </div>
        </div>
    );
}