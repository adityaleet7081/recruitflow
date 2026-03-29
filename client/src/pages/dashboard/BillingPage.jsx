import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function BillingPage() {
    const company = useAuthStore((s) => s.company);
    const [loading, setLoading] = useState(false);

    const { data } = useQuery({
        queryKey: ['plans'],
        queryFn: () => api.get('/billing/plans').then((r) => r.data),
    });

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await api.post('/billing/checkout');
            window.location.href = res.data.url;
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to start checkout');
        } finally {
            setLoading(false);
        }
    };

    const currentPlan = data?.currentPlan || company?.plan || 'free';
    const plans = data?.plans || [];

    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
                    Billing & Plans
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
                    Current plan:{' '}
                    <span style={{ color: '#f59e0b', fontWeight: 600, textTransform: 'capitalize' }}>
                        {currentPlan}
                    </span>
                </p>
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760 }}>
                {plans.map((plan) => {
                    const isPro = plan.id === 'pro';
                    const isCurrent = plan.id === currentPlan;
                    return (
                        <div key={plan.id} style={{
                            background: isPro
                                ? 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(249,115,22,0.04) 100%)'
                                : 'rgba(255,255,255,0.03)',
                            border: isPro
                                ? '1px solid rgba(245,158,11,0.35)'
                                : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 20, padding: 32,
                            position: 'relative', overflow: 'hidden',
                            transition: 'transform 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {isPro && (
                                <div style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    color: '#fff', fontSize: 10, fontWeight: 700,
                                    padding: '3px 10px', borderRadius: 100, letterSpacing: '0.5px',
                                }}>POPULAR</div>
                            )}

                            <div style={{
                                color: isPro ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                                textTransform: 'uppercase', marginBottom: 12,
                            }}>{plan.name}</div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                                <span style={{
                                    fontFamily: "'DM Serif Display', serif",
                                    fontSize: 52, color: '#fff', letterSpacing: '-2px', lineHeight: 1,
                                }}>${plan.price}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>/month</span>
                            </div>

                            <div style={{ marginBottom: 28 }}>
                                {plan.features.map((feature) => (
                                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                            stroke={isPro ? '#f59e0b' : '#10b981'} strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        <span style={{ color: isPro ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            {isCurrent && plan.id === 'free' && (
                                <div style={{
                                    textAlign: 'center', padding: '11px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: 14,
                                }}>Current plan</div>
                            )}
                            {isPro && currentPlan === 'free' && (
                                <button onClick={handleUpgrade} disabled={loading} style={{
                                    width: '100%', padding: '12px',
                                    background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                                    color: '#fff', fontSize: 14, fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.45)'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; }}
                                >{loading ? 'Redirecting...' : 'Upgrade to Pro →'}</button>
                            )}
                            {isPro && currentPlan === 'pro' && (
                                <div style={{
                                    textAlign: 'center', padding: '11px',
                                    background: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.25)',
                                    borderRadius: 10, color: '#10b981', fontSize: 14, fontWeight: 600,
                                }}>✓ Active plan</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Free plan notice */}
            {currentPlan === 'free' && (
                <div style={{
                    marginTop: 24, maxWidth: 760,
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 14, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>Free plan: </span>
                        You can post up to 3 jobs. Upgrade to Pro for unlimited jobs and AI resume scoring.
                    </p>
                </div>
            )}
        </div>
    );
}