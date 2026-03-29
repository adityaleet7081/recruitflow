import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_VIOLATIONS = 3;

export default function AssessmentPage() {
    const { token } = useParams();
    const [phase, setPhase] = useState('loading'); // loading | intro | test | submitting | done | error | expired | completed
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // ── Proctoring state ───────────────────────────────────────────────────────
    const [violationCount, setViolationCount] = useState(0);
    const [warningModal, setWarningModal] = useState(null); // null | { type, count }
    const [proctoringActive, setProctoringActive] = useState(false);

    const timerRef = useRef(null);
    const hasAutoSubmitted = useRef(false);
    const proctoringActiveRef = useRef(false); // ref so event listeners always have latest value
    const violationCountRef = useRef(0);        // ref so event listeners always have latest count

    // Keep refs in sync with state
    useEffect(() => { proctoringActiveRef.current = proctoringActive; }, [proctoringActive]);
    useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);

    // ── Fetch assessment info ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await axios.get(`${API}/public/assessment/${token}`);
                const data = res.data;

                if (data.status === 'completed') return setPhase('completed');
                if (data.status === 'expired') return setPhase('expired');

                setAssessment(data);

                if (data.status === 'started' && data.expires_at) {
                    const remaining = Math.floor((new Date(data.expires_at) - Date.now()) / 1000);
                    if (remaining <= 0) {
                        setPhase('expired');
                    } else {
                        setTimeLeft(remaining);
                        setPhase('test');
                    }
                } else {
                    setPhase('intro');
                }
            } catch (err) {
                setErrorMsg(err.response?.data?.error || 'Invalid or expired assessment link.');
                setPhase('error');
            }
        };
        fetchAssessment();
    }, [token]);

    // ── Auto-submit (timer / violations) ──────────────────────────────────────
    const handleSubmit = useCallback(
        async (reason = 'manual') => {
            if (hasAutoSubmitted.current) return;
            hasAutoSubmitted.current = true;
            clearInterval(timerRef.current);
            setProctoringActive(false);
            setWarningModal(null);
            setPhase('submitting');

            const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
                questionIndex: parseInt(index),
                answer,
            }));

            try {
                await axios.post(`${API}/public/assessment/${token}/submit`, {
                    answers: formattedAnswers,
                });
                setPhase('done');
            } catch (err) {
                setErrorMsg('Submission failed. Please try again.');
                setPhase('error');
            }
        },
        [answers, token]
    );

    // ── Log violation to backend + handle auto-submit ──────────────────────────
    const logViolation = useCallback(
        async (type) => {
            if (!proctoringActiveRef.current) return;
            if (hasAutoSubmitted.current) return;

            let newCount;
            setViolationCount((prev) => {
                newCount = prev + 1;
                violationCountRef.current = newCount;
                return newCount;
            });

            // Fire-and-forget — don't block UI on backend response
            axios
                .post(`${API}/public/assessment/${token}/violation`, { type })
                .catch(() => { }); // silently ignore network errors for violations

            const currentCount = violationCountRef.current;

            if (currentCount >= MAX_VIOLATIONS) {
                // Auto-submit immediately — no modal, just submit
                setWarningModal(null);
                handleSubmit('violations');
            } else {
                setWarningModal({ type, count: currentCount });
            }
        },
        [token, handleSubmit]
    );

    // ── Proctoring event listeners (only active during test) ──────────────────
    useEffect(() => {
        if (!proctoringActive) return;

        // 1. Tab switch / window blur detection
        const handleVisibilityChange = () => {
            if (document.hidden) logViolation('tab_switch');
        };

        // 2. Fullscreen exit detection
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && proctoringActiveRef.current) {
                logViolation('fullscreen_exit');
            }
        };

        // 3. Block copy-paste silently
        const blockCopy = (e) => e.preventDefault();
        const blockPaste = (e) => e.preventDefault();
        const blockCut = (e) => e.preventDefault();

        // 4. Block right-click silently
        const blockContextMenu = (e) => e.preventDefault();

        // 5. Block common keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+A, etc.)
        const blockKeyboard = (e) => {
            if (e.ctrlKey || e.metaKey) {
                const blocked = ['c', 'v', 'x', 'a', 'u', 's'];
                if (blocked.includes(e.key.toLowerCase())) {
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('copy', blockCopy);
        document.addEventListener('paste', blockPaste);
        document.addEventListener('cut', blockCut);
        document.addEventListener('contextmenu', blockContextMenu);
        document.addEventListener('keydown', blockKeyboard);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', blockCopy);
            document.removeEventListener('paste', blockPaste);
            document.removeEventListener('cut', blockCut);
            document.removeEventListener('contextmenu', blockContextMenu);
            document.removeEventListener('keydown', blockKeyboard);
        };
    }, [proctoringActive, logViolation]);

    // ── Countdown timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'test' || timeLeft === null) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit('timer');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [phase, timeLeft, handleSubmit]);

    // ── Start test ─────────────────────────────────────────────────────────────
    const handleStart = async () => {
        try {
            // Request fullscreen first
            try {
                await document.documentElement.requestFullscreen();
            } catch {
                // Fullscreen may be blocked by browser — still allow test to proceed
                // First fullscreen exit won't be counted since proctoring starts after
            }

            const res = await axios.post(`${API}/public/assessment/${token}/start`);
            const remaining = Math.floor((new Date(res.data.expires_at) - Date.now()) / 1000);
            setTimeLeft(Math.max(remaining, 0));
            setPhase('test');

            // Activate proctoring AFTER test starts
            setProctoringActive(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Could not start assessment.');
            setPhase('error');
        }
    };

    // ── Dismiss warning modal ──────────────────────────────────────────────────
    const dismissWarning = () => {
        setWarningModal(null);
        // Re-request fullscreen if they exited it
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    };

    // ── Cleanup fullscreen on unmount / done ──────────────────────────────────
    useEffect(() => {
        if ((phase === 'done' || phase === 'submitting') && document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }, [phase]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const timerColor = timeLeft <= 60 ? '#ef4444' : timeLeft <= 180 ? '#f59e0b' : '#22c55e';
    const progress = assessment ? ((currentQ + 1) / assessment.total_questions) * 100 : 0;

    const violationLabel = {
        tab_switch: 'Tab Switch Detected',
        fullscreen_exit: 'Fullscreen Exit Detected',
    };

    // ── Styles ─────────────────────────────────────────────────────────────────
    const s = {
        page: {
            minHeight: '100vh',
            background: '#080a14',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        },
        card: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '680px',
            width: '100%',
        },
        accent: { color: '#f59e0b' },
        btn: {
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            width: '100%',
            marginTop: '16px',
        },
        btnOutline: {
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
        },
        optionBtn: (selected) => ({
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '14px 18px',
            marginBottom: '10px',
            background: selected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
            border: selected ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.15s',
        }),
        textarea: {
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            padding: '14px',
            fontSize: '15px',
            resize: 'vertical',
            minHeight: '120px',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
        },
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div style={s.page}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading your assessment...</p>
                </div>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div style={s.page}>
                <div style={{ ...s.card, textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h2 style={{ color: '#ef4444' }}>Assessment Unavailable</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>{errorMsg}</p>
                </div>
            </div>
        );
    }

    // ── Already completed ──────────────────────────────────────────────────────
    if (phase === 'completed') {
        return (
            <div style={s.page}>
                <div style={{ ...s.card, textAlign: 'center' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                    <h2 style={s.accent}>Assessment Already Submitted</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                        You have already completed this assessment. Thank you!
                    </p>
                </div>
            </div>
        );
    }

    // ── Expired ────────────────────────────────────────────────────────────────
    if (phase === 'expired') {
        return (
            <div style={s.page}>
                <div style={{ ...s.card, textAlign: 'center' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏰</div>
                    <h2 style={{ color: '#ef4444' }}>Assessment Expired</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your assessment time has expired. Please contact the hiring team.
                    </p>
                </div>
            </div>
        );
    }

    // ── Submitting ─────────────────────────────────────────────────────────────
    if (phase === 'submitting') {
        return (
            <div style={s.page}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>📤</div>
                    <h3 style={s.accent}>Submitting your answers...</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>Please don't close this tab.</p>
                </div>
            </div>
        );
    }

    // ── Done ───────────────────────────────────────────────────────────────────
    if (phase === 'done') {
        return (
            <div style={s.page}>
                <div style={{ ...s.card, textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={s.accent}>Assessment Submitted!</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '12px', lineHeight: '1.6' }}>
                        Thank you for completing the assessment. Your answers are being evaluated by our AI system.
                        The hiring team will review your results and get back to you soon.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '20px' }}>
                        You may close this tab.
                    </p>
                </div>
            </div>
        );
    }

    // ── Intro screen ───────────────────────────────────────────────────────────
    if (phase === 'intro' && assessment) {
        return (
            <div style={s.page}>
                <div style={s.card}>
                    {/* Header */}
                    <div style={{ marginBottom: '28px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '6px' }}>
                            {assessment.company_name}
                        </p>
                        <h1 style={{ fontSize: '26px', margin: '0 0 8px', fontFamily: "'DM Serif Display', serif" }}>
                            Skills Assessment
                        </h1>
                        <p style={{ color: '#f59e0b', fontSize: '16px', margin: 0 }}>
                            {assessment.job_title}
                        </p>
                    </div>

                    {/* Info boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                        {[
                            { icon: '📋', label: 'Questions', value: `${assessment.total_questions}` },
                            { icon: '⏱️', label: 'Time Limit', value: `${assessment.time_limit_minutes} min` },
                            { icon: '📝', label: 'Format', value: 'MCQ + Written' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                                <div style={{ fontWeight: '700', fontSize: '18px' }}>{item.value}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div
                        style={{
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: '10px',
                            padding: '18px',
                            marginBottom: '16px',
                        }}
                    >
                        <p style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '10px' }}>
                            Before you begin:
                        </p>
                        {[
                            'The timer starts only after you click "Begin Assessment" below.',
                            'Answer all questions — unanswered questions count as wrong.',
                            'For written answers, be specific and concise.',
                            'Do not refresh the page once you start — your progress is saved.',
                            `The test auto-submits when the ${assessment.time_limit_minutes}-minute timer ends.`,
                        ].map((tip, i) => (
                            <p
                                key={i}
                                style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', margin: '6px 0' }}
                            >
                                {i + 1}. {tip}
                            </p>
                        ))}
                    </div>

                    {/* Proctoring notice */}
                    <div
                        style={{
                            background: 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                        }}
                    >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>🔒</span>
                        <div>
                            <p style={{ color: '#fca5a5', fontWeight: '600', fontSize: '13px', margin: '0 0 4px' }}>
                                This assessment is proctored
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                                Tab switching and exiting fullscreen will be flagged as violations.
                                After <strong style={{ color: '#fca5a5' }}>3 violations</strong>, your test will be auto-submitted.
                                Copy-paste is disabled.
                            </p>
                        </div>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '8px' }}>
                        Hi <strong style={{ color: '#fff' }}>{assessment.candidate_name}</strong>, good luck!
                    </p>

                    <button style={s.btn} onClick={handleStart}>
                        🔒 Begin Assessment (Fullscreen) →
                    </button>
                </div>
            </div>
        );
    }

    // ── Test screen ────────────────────────────────────────────────────────────
    if (phase === 'test' && assessment) {
        const q = assessment.questions[currentQ];
        const isLast = currentQ === assessment.total_questions - 1;
        const answeredCount = Object.keys(answers).length;

        return (
            <div style={{ minHeight: '100vh', background: '#080a14', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>

                {/* ── Violation Warning Modal ──────────────────────────────── */}
                {warningModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(6px)',
                    }}>
                        <div style={{
                            background: '#0d1225',
                            border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '16px',
                            padding: '36px',
                            maxWidth: '420px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: '0 0 60px rgba(239,68,68,0.15)',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
                            <h2 style={{ color: '#ef4444', fontSize: '20px', margin: '0 0 8px' }}>
                                {violationLabel[warningModal.type] || 'Violation Detected'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
                                This has been flagged and reported to the hiring team.
                            </p>

                            {/* Violation counter pills */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                                {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                                    <div key={i} style={{
                                        width: '36px', height: '8px', borderRadius: '100px',
                                        background: i < warningModal.count
                                            ? '#ef4444'
                                            : 'rgba(255,255,255,0.1)',
                                        transition: 'background 0.3s',
                                    }} />
                                ))}
                            </div>

                            <p style={{
                                color: warningModal.count >= MAX_VIOLATIONS - 1 ? '#ef4444' : '#f59e0b',
                                fontSize: '13px',
                                fontWeight: '600',
                                margin: '0 0 24px',
                            }}>
                                {warningModal.count >= MAX_VIOLATIONS - 1
                                    ? '⚠️ Next violation will auto-submit your test!'
                                    : `Warning ${warningModal.count} of ${MAX_VIOLATIONS} — stay in fullscreen and don't switch tabs.`}
                            </p>

                            <button
                                onClick={dismissWarning}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    color: '#000', border: 'none', borderRadius: '8px',
                                    padding: '12px 32px', fontSize: '14px', fontWeight: '700',
                                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                I understand — Resume Test
                            </button>
                        </div>
                    </div>
                )}

                {/* Top bar */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        background: '#0d1225',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        padding: '14px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 100,
                    }}
                >
                    <div>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                            {assessment.job_title}
                        </span>
                    </div>

                    {/* Center: Timer + violation dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Timer */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: `1px solid ${timerColor}40`,
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>⏱️</span>
                            <span style={{ color: timerColor, fontWeight: '700', fontSize: '20px', fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* Violation dots */}
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }} title={`${violationCount} violation(s)`}>
                            {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                                <div key={i} style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: i < violationCount ? '#ef4444' : 'rgba(255,255,255,0.12)',
                                    transition: 'background 0.3s',
                                }} />
                            ))}
                        </div>
                    </div>

                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                        {answeredCount}/{assessment.total_questions} answered
                    </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>

                {/* Question */}
                <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 24px' }}>
                    {/* Question nav dots */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        {assessment.questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentQ(i)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: i === currentQ ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)',
                                    background: answers[i] !== undefined
                                        ? 'rgba(245,158,11,0.2)'
                                        : i === currentQ
                                            ? 'rgba(245,158,11,0.1)'
                                            : 'transparent',
                                    color: i === currentQ ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: i === currentQ ? '700' : '400',
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {/* Question card */}
                    <div style={s.card}>
                        {/* Question header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span
                                style={{
                                    background: q.type === 'mcq' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
                                    color: q.type === 'mcq' ? '#818cf8' : '#22c55e',
                                    border: `1px solid ${q.type === 'mcq' ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                }}
                            >
                                {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                                Question {currentQ + 1} of {assessment.total_questions}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '24px', fontWeight: '500' }}>
                            {q.question}
                        </h3>

                        {/* MCQ options */}
                        {q.type === 'mcq' && q.options && (
                            <div>
                                {q.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        style={s.optionBtn(answers[currentQ] === opt)}
                                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: opt }))}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Short answer textarea */}
                        {q.type === 'short' && (
                            <div>
                                <textarea
                                    style={s.textarea}
                                    placeholder="Type your answer here..."
                                    value={answers[currentQ] || ''}
                                    onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, [currentQ]: e.target.value }))
                                    }
                                />
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '6px' }}>
                                    Be specific and concise. Aim for 2-4 sentences.
                                </p>
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                            {currentQ > 0 && (
                                <button style={s.btnOutline} onClick={() => setCurrentQ((p) => p - 1)}>
                                    ← Previous
                                </button>
                            )}

                            {!isLast ? (
                                <button
                                    style={{ ...s.btn, marginTop: 0, flex: 1 }}
                                    onClick={() => setCurrentQ((p) => p + 1)}
                                >
                                    Next Question →
                                </button>
                            ) : (
                                <button
                                    style={{
                                        ...s.btn,
                                        marginTop: 0,
                                        flex: 1,
                                        background:
                                            answeredCount === assessment.total_questions
                                                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                                : 'rgba(255,255,255,0.1)',
                                        color: answeredCount === assessment.total_questions ? '#000' : 'rgba(255,255,255,0.4)',
                                    }}
                                    onClick={() => handleSubmit('manual')}
                                >
                                    {answeredCount < assessment.total_questions
                                        ? `Submit (${assessment.total_questions - answeredCount} unanswered)`
                                        : 'Submit Assessment ✓'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}