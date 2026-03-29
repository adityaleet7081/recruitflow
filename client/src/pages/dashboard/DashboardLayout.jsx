import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutAPI } from '../../api/auth';

export default function DashboardLayout() {
    const { user, company, refreshToken, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await logoutAPI({ refreshToken }); } catch { }
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#080a14', fontFamily: "'DM Sans', sans-serif" }}>
            {/* Sidebar */}
            <aside style={{
                width: 220, background: '#0d1225',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>R</div>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>RecruitFlow</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6, paddingLeft: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {company?.name}
                    </p>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px' }}>
                    {[
                        { to: '/dashboard/jobs', icon: '💼', label: 'Jobs' },
                        { to: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
                        { to: '/dashboard/billing', icon: '💳', label: 'Billing' },
                        { to: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
                        { to: '/dashboard/activity', icon: '⚡', label: 'Activity' },
                        { to: '/dashboard/compare', icon: '⚖️', label: 'Compare' },
                    ].map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                            textDecoration: 'none', fontSize: 14, fontWeight: 500,
                            transition: 'all 0.15s',
                            background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent',
                            color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                            borderLeft: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                        })}>
                            <span style={{ fontSize: 16 }}>{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ marginBottom: 12 }}>
                        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user?.email}</p>
                    </div>
                    {company?.plan === 'free' ? (
                        <NavLink to="/dashboard/billing" style={{
                            display: 'block', textAlign: 'center',
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            color: '#fff', fontSize: 12, fontWeight: 600,
                            textDecoration: 'none', padding: '8px', borderRadius: 8,
                            marginBottom: 10, boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                        }}>Upgrade to Pro ✨</NavLink>
                    ) : (
                        <div style={{
                            textAlign: 'center', fontSize: 12, fontWeight: 600,
                            color: '#10b981', background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: 8, padding: '7px', marginBottom: 10,
                        }}>✓ Pro plan</div>
                    )}
                    <button onClick={handleLogout} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(239,68,68,0.7)', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                        padding: 0, transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                        onMouseLeave={e => e.target.style.color = 'rgba(239,68,68,0.7)'}
                    >Sign out</button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, overflowY: 'auto', background: '#080a14' }}>
                <Outlet />
            </main>
        </div>
    );
}