import { NavLink, Outlet } from 'react-router';
import { Heart, BarChart3, CalendarDays, Sparkles, Palette } from 'lucide-react';
import { styles } from '../themeStyles';

export default function Layout() {
    const navItems = [
        { to: "/", label: "Mood Check-In", icon: Heart, end: true },
        { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
        { to: "/calendar", label: "Calendar", icon: CalendarDays },
        { to: "/insights", label: "AI Insights", icon: Sparkles },
        { to: "/drawing", label: "Drawing Space", icon: Palette },
    ];

    return (
        <div style={styles.page} className="min-h-screen relative">
            {/* Glowing Background Orbs */}
            <div className="app-orb app-orb-left"></div>
            <div className="app-orb app-orb-right"></div>

            <div style={styles.container}>
                {/* Header */}
                <header className="glass-card m-6 mb-4">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D1FF] flex items-center justify-center glow-purple">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-white">Mental Wellness</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#00D1FF] glow-cyan"></div>
                                <span className="text-[#AAB2D5] text-sm">Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation */}
                <nav className="glass-card m-6 mt-0 mb-6">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                            ? 'bg-[#6C5CE7] text-white glow-purple'
                                            : 'text-[#AAB2D5] hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="container mx-auto px-6 pb-12 relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
