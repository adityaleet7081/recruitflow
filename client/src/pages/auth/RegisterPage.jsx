import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../../api/auth';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await registerAPI(form);
            const { user, company, accessToken, refreshToken } = res.data;
            setAuth(user, company, accessToken, refreshToken);
            navigate('/dashboard/jobs');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '12px 16px',
        color: '#fff', fontSize: 14, outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: "'DM Sans', sans-serif",
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
                <div style={{
                    position: 'absolute', bottom: '15%', right: '5%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }} />

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
                        Build your dream team<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>10x faster.</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
                        Set up your company workspace in 2 minutes. Start receiving AI-scored applications immediately.
                    </p>

                    {/* Mini steps */}
                    {[
                        { num: '01', text: 'Create your company workspace' },
                        { num: '02', text: 'Post your first job in 60 seconds' },
                        { num: '03', text: 'AI scores every resume automatically' },
                    ].map(({ num, text }) => (
                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#f59e0b', fontSize: 11, fontWeight: 700,
                            }}>{num}</div>
                            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>{text}</span>
                        </div>
                    ))}

                    <div style={{
                        marginTop: 40, padding: '16px 20px',
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        borderRadius: 12,
                    }}>
                        <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Free plan includes</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>3 job postings · AI scoring · Full pipeline · No credit card needed</p>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{
                width: 500, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '60px 48px',
                overflowY: 'auto',
            }}>
                <div style={{ marginBottom: 36 }}>
                    <h1 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 32, fontWeight: 400, color: '#fff',
                        letterSpacing: '-1px', marginBottom: 8,
                    }}>Create your workspace</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                        Free forever · No credit card required
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
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                            Company name
                        </label>
                        <input
                            type="text"
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                            placeholder="Acme Corp"
                            required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                            Your name
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="John Doe"
                            required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                            Work email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@company.com"
                            required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Min 8 characters"
                            required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px',
                            background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                            border: 'none', borderRadius: 10,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            color: '#fff', fontSize: 15, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 12px 32px rgba(245,158,11,0.45)'; } }}
                        onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; }}
                    >
                        {loading ? 'Creating workspace...' : 'Create free workspace →'}
                    </button>
                </form>

                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}