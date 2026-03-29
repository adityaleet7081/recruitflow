import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

function Section({ title, description, children }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, overflow: 'hidden', marginBottom: 20,
        }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{title}</h2>
                {description && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>{description}</p>}
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value, badge }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {badge && (
                    <span style={{
                        background: badge === 'pro' ? 'rgba(245,158,11,0.15)' : badge === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)',
                        border: `1px solid ${badge === 'pro' ? 'rgba(245,158,11,0.3)' : badge === 'admin' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.12)'}`,
                        color: badge === 'pro' ? '#f59e0b' : badge === 'admin' ? '#818cf8' : 'rgba(255,255,255,0.5)',
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                        textTransform: 'capitalize',
                    }}>{badge}</span>
                )}
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user, company } = useAuthStore();
    const [copied, setCopied] = useState(false);

    const { data: meData } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/auth/me').then(r => r.data),
    });

    const { data: teamData } = useQuery({
        queryKey: ['team'],
        queryFn: () => api.get('/auth/team').then(r => r.data).catch(() => ({ members: [] })),
    });

    const publicUrl = `${window.location.origin}/company/${company?.slug}/jobs`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentCompany = meData?.company || company;
    const currentUser = meData?.user || user;
    const members = teamData?.members || [];

    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', maxWidth: 720 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Settings</h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
                    Manage your workspace and account preferences.
                </p>
            </div>

            {/* Company */}
            <Section title="Company" description="Your workspace details">
                <InfoRow label="Company name" value={currentCompany?.name || '—'} />
                <InfoRow label="Slug" value={currentCompany?.slug || '—'} />
                <InfoRow
                    label="Plan"
                    value={currentCompany?.plan === 'pro' ? 'Pro — $29/month' : 'Free — $0/month'}
                    badge={currentCompany?.plan}
                />
                <div style={{ paddingTop: 12 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>Public job board URL</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{
                            flex: 1, background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, padding: '9px 14px',
                            color: 'rgba(255,255,255,0.5)', fontSize: 12,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{publicUrl}</div>
                        <button onClick={handleCopy} style={{
                            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
                            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 8, padding: '9px 16px',
                            color: copied ? '#10b981' : 'rgba(255,255,255,0.6)',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}>{copied ? '✓ Copied!' : 'Copy link'}</button>
                        <a href={publicUrl} target="_blank" rel="noreferrer" style={{
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 8, padding: '9px 16px',
                            color: '#f59e0b', fontSize: 13, fontWeight: 500,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                            transition: 'background 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                        >Open ↗</a>
                    </div>
                </div>
            </Section>

            {/* Account */}
            <Section title="Your Account" description="Your personal profile">
                <InfoRow label="Full name" value={currentUser?.name || '—'} />
                <InfoRow label="Email" value={currentUser?.email || '—'} />
                <InfoRow label="Role" value={currentUser?.role || '—'} badge={currentUser?.role} />
            </Section>

            {/* Team */}
            <Section title="Team Members" description="Everyone with access to this workspace">
                {members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                            Only you are in this workspace · Invite coming soon
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {members.map((member) => (
                            <div key={member.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(99,102,241,0.2))',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 13, fontWeight: 700,
                                }}>{member.name.charAt(0).toUpperCase()}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>{member.name}</p>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '2px 0 0' }}>{member.email}</p>
                                </div>
                                <span style={{
                                    background: member.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.07)',
                                    border: `1px solid ${member.role === 'admin' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    color: member.role === 'admin' ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                    fontSize: 11, fontWeight: 600, padding: '3px 10px',
                                    borderRadius: 100, textTransform: 'capitalize',
                                }}>{member.role}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* AI & Integrations */}
            <Section title="AI & Integrations" description="Connected services powering your workspace">
                {[
                    { name: 'AI Resume Scoring', desc: 'Powered by OpenRouter · nvidia/nemotron', status: 'active', color: '#10b981' },
                    { name: 'Email Notifications', desc: 'Gmail SMTP · Auto-sends on application', status: 'active', color: '#10b981' },
                    { name: 'Stripe Billing', desc: 'Test mode · Payments & subscriptions', status: currentCompany?.plan === 'pro' ? 'active' : 'free tier', color: currentCompany?.plan === 'pro' ? '#10b981' : '#f59e0b' },
                ].map(({ name, desc, status, color }) => (
                    <div key={name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <div>
                            <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>{name}</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '2px 0 0' }}>{desc}</p>
                        </div>
                        <span style={{
                            background: `${color}15`, border: `1px solid ${color}35`,
                            color, fontSize: 11, fontWeight: 600,
                            padding: '3px 10px', borderRadius: 100, textTransform: 'capitalize',
                        }}>{status}</span>
                    </div>
                ))}
            </Section>

            {/* Danger zone */}
            <div style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 16, overflow: 'hidden',
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    <h2 style={{ color: '#ef4444', fontSize: 15, fontWeight: 600, margin: 0 }}>Danger Zone</h2>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '4px 0 0' }}>Irreversible actions — proceed with caution</p>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>Delete workspace</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '4px 0 0' }}>Permanently delete your company and all data</p>
                    </div>
                    <button
                        onClick={() => alert('Please contact support to delete your workspace.')}
                        style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#ef4444', borderRadius: 8, padding: '8px 16px',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    >Delete workspace</button>
                </div>
            </div>
        </div>
    );
}