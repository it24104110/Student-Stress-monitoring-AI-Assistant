import React, { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_QUICK_ACTIONS = [
    { id: "badDay", label: "I had a bad day", message: "I had a bad day." },
    { id: "relaxMind", label: "Want to relax mind", message: "I want to relax my mind." },
    { id: "breathing", label: "Breathing exercises", message: "Can you guide me through breathing exercises?" },
    { id: "checkin", label: "Daily check-in", message: "Let’s do a quick daily check-in." },
];

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function formatTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

function getGreeting(now = new Date()) {
    const h = now.getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
}

function formatFullDate(d = new Date()) {
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getSessionGroupLabel(ts) {
    const now = new Date();
    const d = new Date(ts);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfLast7Days = new Date(startOfToday);
    startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);

    const startOfLast30Days = new Date(startOfToday);
    startOfLast30Days.setDate(startOfLast30Days.getDate() - 30);

    if (d >= startOfToday) return "Today";
    if (d >= startOfYesterday) return "Yesterday";
    if (d >= startOfLast7Days) return "Last 7 days";
    if (d >= startOfLast30Days) return "Last 30 days";
    return "Older";
}

function createAssistantWelcomeMessage() {
    return {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
            "Hi 👋 I’m here to listen. You can talk about anything on your mind. How are you feeling today?",
        ts: Date.now(),
        recommendations: [],
        emotionLabel: null,
        impactLevel: null,
        indicatorGroup: null,
        indicatorLevel: null,
    };
}

export default function FreeChat() {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messagesBySession, setMessagesBySession] = useState({});
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    const listRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = useMemo(() => DEFAULT_QUICK_ACTIONS, []);

    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(t);
    }, []);

    const greeting = useMemo(() => getGreeting(now), [now]);
    const todayFull = useMemo(() => formatFullDate(now), [now]);

    const activeMessages = messagesBySession[activeSessionId] || [];

    const groupedSessions = useMemo(() => {
        const groups = new Map();

        for (const session of sessions) {
            const label = getSessionGroupLabel(session.updatedAt || session.createdAt);
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label).push(session);
        }

        const order = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"];

        return order
            .filter((label) => groups.has(label))
            .map((label) => [
                label,
                groups.get(label).sort(
                    (a, b) =>
                        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                ),
            ]);
    }, [sessions]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [activeMessages, isSending, activeSessionId]);

    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            setIsLoadingSessions(true);
            setError("");

            const res = await fetch("/api/chat/sessions");
            if (!res.ok) {
                throw new Error("Failed to load sessions");
            }

            const data = await res.json();
            setSessions(data);

            if (data.length > 0) {
                const firstSessionId = data[0].sessionId;
                setActiveSessionId(firstSessionId);
                await loadSessionMessages(firstSessionId);
            } else {
                const created = await createNewSessionInternal();
                setActiveSessionId(created.sessionId);
                await loadSessionMessages(created.sessionId);
            }
        } catch (e) {
            console.error(e);
            setError("Couldn’t load chat sessions.");
        } finally {
            setIsLoadingSessions(false);
        }
    }

    async function loadSessionMessages(sessionId) {
        try {
            setIsLoadingMessages(true);
            setError("");

            const res = await fetch(`/api/chat/session/${encodeURIComponent(sessionId)}/messages`);
            if (!res.ok) {
                throw new Error("Failed to load session messages");
            }

            const data = await res.json();

            const mappedMessages =
                data.messages?.map((m) => ({
                    id: m.id,
                    role: String(m.role || "").toLowerCase(),
                    content: m.content,
                    ts: m.createdAt,
                    recommendations: [],
                    emotionLabel: null,
                    impactLevel: null,
                    indicatorGroup: null,
                    indicatorLevel: null,
                })) ?? [];

            setMessagesBySession((prev) => ({
                ...prev,
                [sessionId]:
                    mappedMessages.length > 0 ? mappedMessages : [createAssistantWelcomeMessage()],
            }));
        } catch (e) {
            console.error(e);
            setError("Couldn’t load messages for this session.");
        } finally {
            setIsLoadingMessages(false);
        }
    }

    async function createNewSessionInternal() {
        const res = await fetch("/api/chat/session", {
            method: "POST",
        });

        if (!res.ok) {
            throw new Error("Failed to create session");
        }

        const session = await res.json();

        setSessions((prev) => [session, ...prev]);
        setMessagesBySession((prev) => ({
            ...prev,
            [session.sessionId]: [createAssistantWelcomeMessage()],
        }));

        return session;
    }

    async function handleNewChat() {
        try {
            setError("");
            const session = await createNewSessionInternal();
            setActiveSessionId(session.sessionId);
            setInput("");
            inputRef.current?.focus();
        } catch (e) {
            console.error(e);
            setError("Couldn’t create a new chat.");
        }
    }

    async function handleOpenSession(sessionId) {
        setActiveSessionId(sessionId);

        if (!messagesBySession[sessionId]) {
            await loadSessionMessages(sessionId);
        }

        setError("");
    }

    function appendMessageToSession(sessionId, message) {
        setMessagesBySession((prev) => ({
            ...prev,
            [sessionId]: [...(prev[sessionId] || []), message],
        }));
    }

    function updateSessionLocally(sessionId, updater) {
        setSessions((prev) =>
            prev.map((session) => (session.sessionId === sessionId ? updater(session) : session))
        );
    }

    async function sendMessage(text) {
        const trimmed = text.trim();
        if (!trimmed || isSending || !activeSessionId) return;

        setError("");
        setIsSending(true);

        const userMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
            ts: Date.now(),
            recommendations: [],
            emotionLabel: null,
            impactLevel: null,
            indicatorGroup: null,
            indicatorLevel: null,
        };

        appendMessageToSession(activeSessionId, userMessage);

        updateSessionLocally(activeSessionId, (session) => ({
            ...session,
            title:
                !session.title || session.title === "New chat"
                    ? trimmed.length > 42
                        ? `${trimmed.slice(0, 42)}…`
                        : trimmed
                    : session.title,
            updatedAt: new Date().toISOString(),
        }));

        setInput("");

        try {
            console.log("sending with sessionId =", activeSessionId);

            const res = await fetch(`/api/chat/send?sessionId=${encodeURIComponent(activeSessionId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(trimmed),
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || "Request failed");
            }

            const data = await res.json();

            appendMessageToSession(activeSessionId, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.assistantMessage ?? "Thanks for sharing.",
                ts: Date.now(),
                recommendations: data.recommendations ?? [],
                emotionLabel: data.emotionLabel ?? null,
                impactLevel: data.impactLevel ?? null,
                indicatorGroup: data.indicatorGroup ?? null,
                indicatorLevel: data.indicatorLevel ?? null,
            });

            updateSessionLocally(activeSessionId, (session) => ({
                ...session,
                updatedAt: new Date().toISOString(),
            }));
        } catch (e) {
            console.error(e);
            setError("Couldn’t send. Please try again.");

            appendMessageToSession(activeSessionId, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Sorry — I had trouble responding just now. Please try again.",
                ts: Date.now(),
                recommendations: [],
                emotionLabel: null,
                impactLevel: null,
                indicatorGroup: null,
                indicatorLevel: null,
            });
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        sendMessage(input);
    }

    function onQuickAction(action) {
        sendMessage(action.message);
    }

    return (
        <div style={styles.page}>
            <div style={styles.layout}>
                <aside
                    style={{
                        ...styles.sidebar,
                        ...(isMenuOpen ? styles.sidebarOpen : styles.sidebarClosed),
                    }}
                >
                    <div style={styles.sidebarTop}>
                        <div>
                            <div style={styles.sidebarTitle}>Wellbeing Support Tool</div>
                            <div style={styles.sidebarSub}>{todayFull}</div>
                            <div style={styles.sidebarGreeting}>{greeting} 👋</div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            style={styles.iconBtn}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <button type="button" style={styles.newChatBtn} onClick={handleNewChat}>
                        + New chat
                    </button>

                    <div style={styles.sidebarSectionTitle}>Chat history</div>

                    <div style={styles.sidebarList}>
                        {isLoadingSessions ? (
                            <div style={styles.sidebarLoading}>Loading sessions...</div>
                        ) : (
                            groupedSessions.map(([groupLabel, groupSessions]) => (
                                <div key={groupLabel} style={styles.sidebarGroup}>
                                    <div style={styles.sidebarGroupTitle}>{groupLabel}</div>

                                    {groupSessions.map((session) => (
                                        <button
                                            key={session.sessionId}
                                            type="button"
                                            style={{
                                                ...styles.historyItem,
                                                ...(session.sessionId === activeSessionId
                                                    ? styles.historyItemActive
                                                    : {}),
                                            }}
                                            onClick={() => handleOpenSession(session.sessionId)}
                                        >
                                            <div style={styles.historyText}>
                                                {session.title?.length > 42
                                                    ? `${session.title.slice(0, 42)}…`
                                                    : session.title}
                                            </div>
                                            <div style={styles.historyMeta}>
                                                {formatTime(session.updatedAt || session.createdAt)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main style={styles.main}>
                    <div style={styles.topbar}>
                        {!isMenuOpen && (
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(true)}
                                style={styles.menuBtn}
                                title="Open menu"
                            >
                                ☰
                            </button>
                        )}
                    </div>

                    <div style={styles.shell}>
                        <header style={styles.header}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={styles.title}>Open Talk</div>
                                <div style={styles.subtitle}>
                                    Talk freely about your feelings — safe, supportive, non-diagnostic.
                                </div>
                            </div>

                            <div style={styles.badge}>
                                <span style={styles.badgeDot} />
                                Online
                            </div>
                        </header>

                        <div style={styles.quickRow}>
                            {quickActions.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => onQuickAction(a)}
                                    style={styles.chip}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>

                        <div style={styles.chatArea}>
                            <div ref={listRef} style={styles.messageList}>
                                <div style={styles.messageInner}>
                                    {isLoadingMessages ? (
                                        <div style={styles.loadingMessages}>Loading messages...</div>
                                    ) : (
                                        activeMessages.map((m) => (
                                            <div
                                                key={m.id}
                                                className={cx(m.role === "user" ? "msgRowUser" : "msgRowBot")}
                                            >
                                                <div
                                                    style={{
                                                        ...styles.bubble,
                                                        ...(m.role === "user" ? styles.bubbleUser : styles.bubbleBot),
                                                    }}
                                                >
                                                    <div style={styles.msgText}>{m.content}</div>

                                                    {m.role === "assistant" &&
                                                    Array.isArray(m.recommendations) &&
                                                    m.recommendations.length > 0 ? (
                                                        <div style={styles.recommendationWrap}>
                                                            {m.recommendations.map((rec) => (
                                                                <div key={rec.id} style={styles.recommendationChip}>
                                                                    <span style={styles.recommendationTitle}>{rec.title}</span>
                                                                    {rec.minutes ? (
                                                                        <span style={styles.recommendationMeta}>{rec.minutes} min</span>
                                                                    ) : null}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}

                                                    <div style={styles.msgMeta}>{formatTime(m.ts)}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {isSending && (
                                        <div className="msgRowBot" style={{ display: "flex" }}>
                                            <div style={{ ...styles.bubble, ...styles.bubbleBot }}>
                                                <div style={styles.typing}>
                                                    <span style={styles.dot} />
                                                    <span style={styles.dot} />
                                                    <span style={styles.dot} />
                                                    <span style={{ marginLeft: 10, opacity: 0.8 }}>Thinking…</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={styles.footerWrap}>
                                <form onSubmit={onSubmit} style={styles.footer}>
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type how you feel…"
                                        style={styles.input}
                                        disabled={isSending || isLoadingMessages}
                                    />
                                    <button
                                        type="submit"
                                        style={styles.sendBtn}
                                        disabled={isSending || isLoadingMessages || !input.trim()}
                                        title="Send"
                                    >
                                        Send
                                    </button>
                                </form>

                                {error && <div style={styles.error}>{error}</div>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
        .msgRowUser { display:flex; justify-content:flex-end; padding: 8px 0; }
        .msgRowBot  { display:flex; justify-content:flex-start; padding: 8px 0; }
      `}</style>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        width: "100vw",
        background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(140,90,255,0.25), transparent 60%)," +
            "radial-gradient(900px 500px at 80% 0%, rgba(0,220,255,0.18), transparent 55%)," +
            "linear-gradient(180deg, #05060a 0%, #060817 60%, #060614 100%)",
        display: "flex",
        padding: 0,
        margin: 0,
        color: "rgba(255,255,255,0.92)",
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        overflow: "hidden",
    },

    layout: {
        width: "100%",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
    },

    sidebar: {
        height: "100vh",
        background: "rgba(8,10,18,0.92)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "width 160ms ease",
        flexShrink: 0,
    },

    sidebarOpen: { width: 320 },
    sidebarClosed: { width: 0 },

    sidebarTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
    },

    sidebarTitle: {
        fontSize: 16,
        fontWeight: 800,
        background:
            "linear-gradient(90deg, rgba(180,120,255,1) 0%, rgba(90,210,255,1) 70%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    sidebarSub: {
        marginTop: 6,
        fontSize: 12,
        opacity: 0.75,
    },

    sidebarGreeting: {
        marginTop: 6,
        fontSize: 13,
        opacity: 0.9,
    },

    iconBtn: {
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.92)",
        borderRadius: 10,
        padding: "8px 10px",
    },

    newChatBtn: {
        margin: "10px 14px 6px",
        width: "calc(100% - 28px)",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
            "linear-gradient(90deg, rgba(180,120,255,0.20) 0%, rgba(90,210,255,0.14) 90%)",
        color: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: "10px 12px",
        fontWeight: 700,
        textAlign: "left",
        cursor: "pointer",
    },

    sidebarSectionTitle: {
        padding: "12px 14px",
        fontSize: 12,
        opacity: 0.75,
    },

    sidebarList: {
        padding: "0 10px 14px",
        overflowY: "auto",
        flex: 1,
    },

    sidebarLoading: {
        padding: "8px 6px",
        fontSize: 13,
        opacity: 0.7,
    },

    sidebarGroup: {
        padding: "10px 4px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },

    sidebarGroupTitle: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 8,
    },

    historyItem: {
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        color: "rgba(255,255,255,0.92)",
        borderRadius: 12,
        padding: "10px 10px",
        marginBottom: 8,
    },

    historyItemActive: {
        background: "rgba(180,120,255,0.10)",
        border: "1px solid rgba(180,120,255,0.28)",
    },

    historyText: {
        fontSize: 13,
        lineHeight: 1.25,
        opacity: 0.95,
    },

    historyMeta: {
        marginTop: 6,
        fontSize: 11,
        opacity: 0.6,
    },

    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "100vh",
        overflow: "hidden",
    },

    topbar: {
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        flexShrink: 0,
    },

    menuBtn: {
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.92)",
        borderRadius: 10,
        padding: "8px 10px",
        fontSize: 16,
    },

    shell: {
        width: "100%",
        height: "calc(100vh - 44px)",
        background: "rgba(8,10,18,0.70)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },

    header: {
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
    },

    title: {
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 0.2,
        background:
            "linear-gradient(90deg, rgba(180,120,255,1) 0%, rgba(90,210,255,1) 70%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    subtitle: {
        marginTop: 4,
        fontSize: 13,
        opacity: 0.8,
    },

    badge: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
    },

    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: "rgba(90,210,255,1)",
        boxShadow: "0 0 14px rgba(90,210,255,0.55)",
    },

    quickRow: {
        padding: "12px 16px",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
    },

    chip: {
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
            "linear-gradient(90deg, rgba(180,120,255,0.16) 0%, rgba(90,210,255,0.12) 80%)",
        color: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 13,
    },

    chatArea: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },

    messageList: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "16px 0",
    },

    messageInner: {
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
        padding: "0 18px",
    },

    loadingMessages: {
        fontSize: 14,
        opacity: 0.7,
        padding: "12px 0",
    },

    bubble: {
        maxWidth: "78%",
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
    },

    bubbleUser: {
        background:
            "linear-gradient(90deg, rgba(180,120,255,0.22) 0%, rgba(90,210,255,0.12) 90%)",
    },

    bubbleBot: {
        background: "rgba(255,255,255,0.04)",
    },

    msgText: {
        whiteSpace: "pre-wrap",
        lineHeight: 1.45,
        fontSize: 15,
    },

    recommendationWrap: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
    },

    recommendationChip: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(90,210,255,0.08)",
        fontSize: 12,
    },

    recommendationTitle: {
        opacity: 0.95,
    },

    recommendationMeta: {
        opacity: 0.7,
    },

    msgMeta: {
        marginTop: 6,
        fontSize: 11,
        opacity: 0.6,
        textAlign: "right",
    },

    footerWrap: {
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8,10,18,0.96)",
        paddingBottom: 10,
    },

    footer: {
        display: "flex",
        gap: 10,
        padding: "14px 16px 10px",
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
    },

    input: {
        flex: 1,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.92)",
        padding: "12px 12px",
        fontSize: 14,
        outline: "none",
    },

    sendBtn: {
        borderRadius: 14,
        padding: "12px 16px",
        border: "1px solid rgba(255,255,255,0.16)",
        background:
            "linear-gradient(90deg, rgba(180,120,255,0.55) 0%, rgba(90,210,255,0.45) 90%)",
        color: "#0b0d14",
        fontWeight: 800,
        cursor: "pointer",
    },

    typing: {
        display: "flex",
        alignItems: "center",
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 99,
        marginRight: 6,
        background: "rgba(90,210,255,1)",
        boxShadow: "0 0 14px rgba(90,210,255,0.45)",
    },

    error: {
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
        padding: "0 16px",
        color: "rgba(255,140,140,0.95)",
        fontSize: 13,
    },
};