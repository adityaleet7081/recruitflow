import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverview, fetchJobAnalytics } from '../../api/analytics';
import { getJobsAPI } from '../../api/jobs';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const STAGE_COLORS = {
    applied: '#6366f1', screened: '#8b5cf6', interview: '#f59e0b',
    offer: '#10b981', hired: '#059669', rejected: '#ef4444',
};
const STAGE_ORDER = ['applied', 'screened', 'interview', 'offer', 'hired', 'rejected'];
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

const darkTooltip = {
    contentStyle: { background: '#0d1225', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
    labelStyle: { color: '#f59e0b', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: 'rgba(255,255,255,0.8)' },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
};

function StatCard({ label, value, sub, accent = '#6366f1' }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${accent}25`,
            borderRadius: 14, padding: '20px 22px',
            transition: 'border-color 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${accent}50`}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${accent}25`}
        >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
            <p style={{ color: '#fff', fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{value ?? '—'}</p>
            {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 6 }}>{sub}</p>}
        </div>
    );
}

function ChartCard({ title, children, span2 = false }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: 24,
            gridColumn: span2 ? 'span 2' : 'span 1',
        }}>
            {title && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 20, letterSpacing: '0.3px' }}>{title}</p>}
            {children}
        </div>
    );
}

function EmptyChart({ text = 'No data available yet' }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            {text}
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid rgba(245,158,11,0.2)',
                borderTopColor: '#f59e0b',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );
}

function ScoreBadge({ score }) {
    const s = Number(score);
    const color = s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <span style={{
            background: `${color}18`, border: `1px solid ${color}40`,
            color, fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 100,
        }}>{s}/100</span>
    );
}

function OverviewTab() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['analytics', 'overview'],
        queryFn: fetchOverview,
    });

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>Failed to load analytics.</div>;

    const s = data.summary;
    const stageData = STAGE_ORDER.map((stage) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: Number(data.stageDistribution.find((r) => r.stage === stage)?.count ?? 0),
        fill: STAGE_COLORS[stage],
    }));
    const timeline = data.applicationTimeline.map((r) => ({ date: r.date?.slice(5), applications: Number(r.count) }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <StatCard label="Total Jobs" value={s.total_jobs} sub={`${s.open_jobs} open · ${s.closed_jobs} closed`} accent="#6366f1" />
                <StatCard label="Total Candidates" value={s.total_candidates} sub="across all jobs" accent="#8b5cf6" />
                <StatCard label="Total Hired" value={s.total_hired} sub={`${s.total_offers} in offer stage`} accent="#10b981" />
                <StatCard label="Avg AI Score" value={s.avg_ai_score ? `${s.avg_ai_score}/100` : '—'} sub="resume score" accent="#f59e0b" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ChartCard title="Pipeline Stage Distribution">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={stageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                            <Tooltip {...darkTooltip} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {stageData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Candidate Sources">
                    {data.sourceDistribution.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={data.sourceDistribution} dataKey="count" nameKey="source"
                                    cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                                    {data.sourceDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip {...darkTooltip} formatter={(v) => [`${v} candidates`, 'Count']} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Applications — Last 30 Days" span2>
                    {timeline.length === 0 ? <EmptyChart text="No applications in the last 30 days" /> : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                <Tooltip {...darkTooltip} />
                                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Top Jobs by Candidate Volume" span2>
                    {data.candidatesPerJob.length === 0 ? <EmptyChart /> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Job Title', 'Candidates', 'Avg AI Score', 'Volume'].map(h => (
                                        <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textAlign: h === 'Job Title' ? 'left' : 'center', paddingBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.candidatesPerJob.map((job) => (
                                    <tr key={job.job_id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ color: '#fff', fontSize: 13, fontWeight: 500, padding: '12px 0' }}>{job.title}</td>
                                        <td style={{ textAlign: 'center', color: '#6366f1', fontSize: 13, fontWeight: 700 }}>{job.candidate_count}</td>
                                        <td style={{ textAlign: 'center', padding: '12px 0' }}>{job.avg_score ? <ScoreBadge score={job.avg_score} /> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                                        <td style={{ padding: '12px 0 12px 16px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: 6, borderRadius: 100, background: '#6366f1',
                                                    width: `${Math.min(100, (job.candidate_count / Math.max(...data.candidatesPerJob.map(j => j.candidate_count))) * 100)}%`,
                                                }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </ChartCard>
            </div>
        </div>
    );
}

function JobTab() {
    const [selectedJobId, setSelectedJobId] = useState('');
    const { data: jobsData } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobsAPI().then((r) => r.data) });
    const jobs = jobsData?.jobs ?? jobsData ?? [];
    const { data, isLoading, isError } = useQuery({
        queryKey: ['analytics', 'job', selectedJobId],
        queryFn: () => fetchJobAnalytics(selectedJobId),
        enabled: !!selectedJobId,
    });

    const scoreData = data ? Object.entries(data.scoreDistribution ?? {}).map(([range, count]) => ({ range, count: Number(count) })) : [];
    const timeline = (data?.applicationTimeline ?? []).map((r) => ({ date: r.date?.slice(5), applications: Number(r.count) }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: 20,
            }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select a Job to Analyse
                </label>
                <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', maxWidth: 420,
                    cursor: 'pointer',
                }}>
                    <option value="" style={{ background: '#0d1225' }}>— Choose a job —</option>
                    {jobs.map((j) => <option key={j.id} value={j.id} style={{ background: '#0d1225' }}>{j.title} ({j.status})</option>)}
                </select>
            </div>

            {!selectedJobId && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                    Select a job above to view its analytics
                </div>
            )}
            {selectedJobId && isLoading && <LoadingSpinner />}
            {selectedJobId && isError && <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>Failed to load.</div>}

            {data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatCard label="Total Applicants" value={data.summary.total_applicants} accent="#6366f1" />
                        <StatCard label="Offers Extended" value={data.summary.offers} accent="#f59e0b" />
                        <StatCard label="Hired" value={data.summary.hired} accent="#10b981" />
                        <StatCard label="Offer Rate" value={data.summary.offer_rate ? `${data.summary.offer_rate}%` : '—'} sub="(offer + hired) / total" accent="#8b5cf6" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatCard label="Avg AI Score" value={data.summary.avg_score ? `${data.summary.avg_score}/100` : '—'} accent="#f59e0b" />
                        <StatCard label="Top AI Score" value={data.summary.top_score ? `${data.summary.top_score}/100` : '—'} accent="#10b981" />
                        <StatCard label="Rejected" value={data.summary.rejected} accent="#ef4444" />
                        <StatCard label="Avg Days to Hire" value={data.timeToHire?.avg_days_to_hire ?? '—'} sub="applied → hired" accent="#6366f1" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <ChartCard title="Pipeline Funnel">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {STAGE_ORDER.map((stage) => {
                                    const count = Number(data.stageFunnel.find((r) => r.stage === stage)?.count ?? 0);
                                    const max = Math.max(...STAGE_ORDER.map((s) => Number(data.stageFunnel.find((r) => r.stage === s)?.count ?? 0)));
                                    const pct = max > 0 ? (count / max) * 100 : 0;
                                    return (
                                        <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ width: 64, textAlign: 'right', color: 'rgba(255,255,255,0.35)', fontSize: 12, textTransform: 'capitalize' }}>{stage}</span>
                                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 28, overflow: 'hidden', position: 'relative' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: STAGE_COLORS[stage], borderRadius: 100, transition: 'width 0.5s ease' }} />
                                                {count > 0 && (
                                                    <span style={{ position: 'absolute', left: 10, top: 0, height: '100%', display: 'flex', alignItems: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{count}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ChartCard>

                        <ChartCard title="Candidate Sources">
                            {(data.sourceBreakdown ?? []).length === 0 ? <EmptyChart /> : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={data.sourceBreakdown} dataKey="count" nameKey="source"
                                            cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                                            label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                                            {data.sourceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip {...darkTooltip} formatter={(v) => [`${v} candidates`, 'Count']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="AI Score Distribution">
                            {scoreData.every((d) => d.count === 0) ? <EmptyChart text="No AI scores yet" /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                        <Tooltip {...darkTooltip} />
                                        <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title="Applications — Last 30 Days">
                            {timeline.length === 0 ? <EmptyChart text="No applications in the last 30 days" /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                                        <Tooltip {...darkTooltip} />
                                        <Area type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} fill="url(#grad2)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>
                </>
            )}
        </div>
    );
}

const TABS = [
    { id: 'overview', label: '📊 Company Overview' },
    { id: 'job', label: '🔍 Job Analytics' },
];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Analytics</h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
                    Track hiring performance, pipeline health, and candidate insights.
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'inline-flex', gap: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: 4, marginBottom: 24,
            }}>
                {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                        background: activeTab === tab.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                        color: activeTab === tab.id ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                        border: activeTab === tab.id ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                        transition: 'all 0.2s',
                    }}>{tab.label}</button>
                ))}
            </div>

            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'job' && <JobTab />}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}