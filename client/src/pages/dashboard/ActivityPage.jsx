import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const TYPE_CONFIG = {
    candidate_applied: { icon: '👤', color: '#6366f1', label: 'Applied' },
    stage_changed: { icon: '🔄', color: '#f59e0b', label: 'Stage' },
    job_posted: { icon: '💼', color: '#10b981', label: 'Job' },
    job_closed: { icon: '🔒', color: '#ef4444', label: 'Closed' },
    job_deleted: { icon: '🗑️', color: '#ef4444', label: 'Deleted' },
    ai_scored: { icon: '🤖', color: '#8b5cf6', label: 'AI' },
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function groupByDate(activities) {
    const groups = {};
    activities.forEach(a => {
        const date = new Date(a.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label;
        if (date.toDateString() === today.toDateString()) label = 'Today';
        else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
        else label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        if (!groups[label]) groups[label] = [];
        groups[label].push(a);
    });
    return groups;
}

export default function ActivityPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['activity'],
        queryFn: () => api.get('/activity?limit=50').then(r => r.data),
        refetchInterval: 30000, // refresh every 30s
    });

    const activities = data?.activities || [];
    const groups = groupByDate(activities);

    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', maxWidth: 720 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Activity</h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
                        Recent events across your workspace · Auto-refreshes every 30s
                    </p>
                </div>
                {activities.length > 0 && (
                    <div style={{
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 100, padding: '4px 12px',
                        color: '#f59e0b', fontSize: 12, fontWeight: 600,
                    }}>{activities.length} events</div>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '16px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.1}s`,
                        }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ width: '60%', height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8 }} />
                                <div style={{ width: '40%', height: 11, background: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {isError && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444', fontSize: 14 }}>
                    Failed to load activity. Please try again.
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && activities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, margin: '0 auto 20px',
                    }}>📋</div>
                    <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>No activity yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                        Activity will appear here as you post jobs and receive applications.
                    </p>
                </div>
            )}

            {/* Activity groups */}
            {!isLoading && !isError && Object.entries(groups).map(([dateLabel, items]) => (
                <div key={dateLabel} style={{ marginBottom: 28 }}>
                    {/* Date label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {dateLabel}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {items.map((activity) => {
                            const config = TYPE_CONFIG[activity.type] || { icon: '📌', color: '#6366f1', label: 'Event' };
                            return (
                                <div key={activity.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 14,
                                    padding: '14px 18px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 12,
                                    transition: 'border-color 0.2s, background 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${config.color}30`; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: `${config.color}15`,
                                        border: `1px solid ${config.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16,
                                    }}>{config.icon}</div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                            <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, margin: 0 }}>
                                                {activity.title}
                                            </p>
                                            <span style={{
                                                background: `${config.color}15`, border: `1px solid ${config.color}25`,
                                                color: config.color, fontSize: 10, fontWeight: 600,
                                                padding: '1px 7px', borderRadius: 100, flexShrink: 0,
                                            }}>{config.label}</span>
                                        </div>
                                        {activity.description && (
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                                                {activity.description}
                                            </p>
                                        )}
                                        {activity.user_name && (
                                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: '4px 0 0' }}>
                                                by {activity.user_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, flexShrink: 0, marginTop: 2 }}>
                                        {timeAgo(activity.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
        </div>
    );
}