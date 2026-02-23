import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Open Talk (Free Chat) UI (React + JS) in dark neon theme (purple/cyan).
 * - Frontend calls your backend: POST /api/chat
 * - Backend calls OpenAI (keeps API key safe)
 */

const DEFAULT_QUICK_ACTIONS = [
    { id: "badDay", label: "I had a bad day" },
    { id: "relaxMind", label: "Want to relax mind" },
    { id: "breathing", label: "Breathing exercises" },
    { id: "checkin", label: "Daily check-in" },
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

function toDateKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

function labelDateKey(dateKey) {
    const todayKey = toDateKey(Date.now());
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayKey = toDateKey(y.getTime());

    if (dateKey === todayKey) return "Today";
    if (dateKey === yesterdayKey) return "Yesterday";

    const [yy, mm, dd] = dateKey.split("-").map(Number);
    const d = new Date(yy, mm - 1, dd);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function FreeChat() {
    const [messages, setMessages] = useState(() => [
        {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
                "Hi 👋 I’m here to listen. You can talk about anything on your mind. How are you feeling today?",
            ts: Date.now(),
        },
    ]);

    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");

    // Sidebar open/close
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    // Optional: store session id for back-to-back chat
    const [sessionId] = useState(() => crypto.randomUUID());

    const listRef = useRef(null);
    const inputRef = useRef(null);

    const quickActions = useMemo(() => DEFAULT_QUICK_ACTIONS, []);

    // greeting + date (updates every minute)
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(t);
    }, []);

    const greeting = useMemo(() => getGreeting(now), [now]);
    const todayFull = useMemo(() => formatFullDate(now), [now]);

    // Group chat history by date
    const chatHistoryByDate = useMemo(() => {
        const groups = new Map();
        for (const m of messages) {
            const key = toDateKey(m.ts);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(m);
        }
        return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
    }, [messages]);

    useEffect(() => {
        // Auto scroll to bottom on new message
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages, isSending]);

    function pushMessage(role, content) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content, ts: Date.now() }]);
    }

    async function sendMessage(text) {
        const trimmed = text.trim();
        if (!trimmed || isSending) return;

        setError("");
        setIsSending(true);

        // Add user message immediately
        pushMessage("user", trimmed);
        setInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    message: trimmed,
                }),
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || "Request failed");
            }

            const data = await res.json();
            pushMessage("assistant", data.reply ?? "Thanks for sharing. Tell me more.");
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            setError("Couldn’t send. Please try again.");
            pushMessage("assistant", "Sorry — I had trouble responding just now. Please try again.");
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        sendMessage(input);
    }

    function onQuickAction(actionId) {
        if (actionId === "badDay") return sendMessage("I had a bad day.");
        if (actionId === "relaxMind") return sendMessage("I want to relax my mind.");
        if (actionId === "breathing") return sendMessage("Can you guide me through breathing exercises?");
        if (actionId === "checkin") return sendMessage("Let’s do a quick daily check-in.");
    }

    return (
        <div style={styles.page}>
            <div style={styles.layout}>
                {/* Sidebar */}
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

                    <div style={styles.sidebarSectionTitle}>Chat history</div>

                    <div style={styles.sidebarList}>
                        {chatHistoryByDate.map(([dateKey, msgs]) => (
                            <div key={dateKey} style={styles.sidebarGroup}>
                                <div style={styles.sidebarGroupTitle}>{labelDateKey(dateKey)}</div>

                                {msgs
                                    .filter((m) => m.role === "user")
                                    .slice(-4)
                                    .reverse()
                                    .map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            style={styles.historyItem}
                                            onClick={() => {
                                                // simple behavior: scroll to bottom
                                                listRef.current?.scrollTo({
                                                    top: listRef.current.scrollHeight,
                                                    behavior: "smooth",
                                                });
                                            }}
                                        >
                                            <div style={styles.historyText}>
                                                {m.content.length > 42 ? m.content.slice(0, 42) + "…" : m.content}
                                            </div>
                                            <div style={styles.historyMeta}>{formatTime(m.ts)}</div>
                                        </button>
                                    ))}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main */}
                <main style={styles.main}>
                    {/* Top bar */}
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

                    {/* Chat shell */}
                    <div style={styles.shell}>
                        {/* Header */}
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

                        {/* Quick Actions */}
                        <div style={styles.quickRow}>
                            {quickActions.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => onQuickAction(a.id)}
                                    style={styles.chip}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>

                        {/* Chat Body */}
                        <div style={styles.body}>
                            <div ref={listRef} style={styles.messageList}>
                                {messages.map((m) => (
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
                                            <div style={styles.msgMeta}>{formatTime(m.ts)}</div>
                                        </div>
                                    </div>
                                ))}

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

                            {/* Footer Input */}
                            <form onSubmit={onSubmit} style={styles.footer}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type how you feel…"
                                    style={styles.input}
                                    disabled={isSending}
                                />
                                <button
                                    type="submit"
                                    style={styles.sendBtn}
                                    disabled={isSending || !input.trim()}
                                    title="Send"
                                >
                                    Send
                                </button>
                            </form>

                            {error && <div style={styles.error}>{error}</div>}
                        </div>
                    </div>
                </main>
            </div>

            {/* Small CSS helpers (row alignment) */}
            <style>{`
        .msgRowUser { display:flex; justify-content:flex-end; padding: 6px 0; }
        .msgRowBot  { display:flex; justify-content:flex-start; padding: 6px 0; }
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
    },

    layout: {
        width: "100%",
        height: "100vh",
        display: "flex",
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

    sidebarSectionTitle: {
        padding: "12px 14px",
        fontSize: 12,
        opacity: 0.75,
    },

    sidebarList: {
        padding: "0 10px 14px",
        overflowY: "auto",
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
    },

    topbar: {
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
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
        borderRadius: 0,
        border: "none",
        background: "rgba(8,10,18,0.70)",
        backdropFilter: "blur(10px)",
        boxShadow: "none",
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
        transition: "transform 0.08s ease",
    },

    body: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },

    messageList: {
        flex: 1,
        padding: "14px 16px",
        overflowY: "auto",
    },

    bubble: {
        maxWidth: "75%",
        padding: "12px 12px",
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
        lineHeight: 1.35,
        fontSize: 14,
    },

    msgMeta: {
        marginTop: 6,
        fontSize: 11,
        opacity: 0.6,
        textAlign: "right",
    },

    footer: {
        display: "flex",
        gap: 10,
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.12)",
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
        padding: "12px 14px",
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
        animation: "blink 1.2s infinite ease-in-out",
    },

    error: {
        padding: "0 16px 14px",
        color: "rgba(255,140,140,0.95)",
        fontSize: 13,
    },
};