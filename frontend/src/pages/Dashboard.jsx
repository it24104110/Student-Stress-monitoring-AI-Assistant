import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
    const [moodData, setMoodData] = useState([]);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const fetchMoodData = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/mood-entries');
                const entries = response.data || [];

                // Calculate streak
                const today = new Date().toDateString();
                let currentStreak = 0;
                const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

                for (let i = 0; i < sortedEntries.length; i++) {
                    const entryDate = new Date(sortedEntries[i].date).toDateString();
                    const expectedDate = new Date();
                    expectedDate.setDate(expectedDate.getDate() - i);

                    if (entryDate === expectedDate.toDateString()) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
                setStreak(currentStreak);

                // Prepare chart data (last 7 days)
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const dayEntries = entries.filter(entry => {
                        const entryDate = new Date(entry.date).toDateString();
                        return entryDate === date.toDateString();
                    });

                    if (dayEntries.length > 0) {
                        const avgStress = dayEntries.reduce((sum, e) => sum + e.stressLevel, 0) / dayEntries.length;
                        const avgEnergy = dayEntries.reduce((sum, e) => sum + e.energyLevel, 0) / dayEntries.length;
                        const avgSleep = dayEntries.reduce((sum, e) => sum + e.sleepQuality, 0) / dayEntries.length;

                        last7Days.push({
                            date: `${dateStr}`,
                            stress: Math.round(avgStress * 10) / 10,
                            energy: Math.round(avgEnergy * 10) / 10,
                            sleep: Math.round(avgSleep * 10) / 10,
                        });
                    } else {
                        last7Days.push({
                            date: `${dateStr}`,
                            stress: 0,
                            energy: 0,
                            sleep: 0,
                        });
                    }
                }
                setMoodData(last7Days);
            } catch (error) {
                console.error("Failed to fetch mood entries for dashboard:", error);
            }
        };

        fetchMoodData();
    }, []);

    // Mood distribution data
    const moodDistribution = [
        { name: 'Happy', value: 8, color: '#6C5CE7' },
        { name: 'Neutral', value: 5, color: '#7D6BFF' },
        { name: 'Sad', value: 3, color: '#00D1FF' },
        { name: 'Angry', value: 2, color: '#AAB2D5' },
        { name: 'Excited', value: 6, color: '#9B8AFF' },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Streak */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Mood Analytics Dashboard</h2>
                <div className="glass-card px-6 py-3 flex items-center gap-2">
                    <Flame className="w-6 h-6 text-[#00D1FF] glow-cyan" />
                    <span className="text-white font-semibold">{streak} Day Check-In Streak</span>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood Trends */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Mood Trends (Weekly)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#AAB2D5" />
                            <YAxis stroke="#AAB2D5" domain={[0, 5]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26, 31, 60, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#FFFFFF'
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#AAB2D5' }} />
                            <Line
                                type="monotone"
                                dataKey="stress"
                                stroke="#6C5CE7"
                                strokeWidth={3}
                                name="Stress"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="energy"
                                stroke="#00D1FF"
                                strokeWidth={3}
                                name="Energy"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sleep"
                                stroke="#7D6BFF"
                                strokeWidth={3}
                                name="Sleep"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stress Level Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Stress Level Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#AAB2D5" />
                            <YAxis stroke="#AAB2D5" domain={[0, 5]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26, 31, 60, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#FFFFFF'
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#AAB2D5' }} />
                            <Bar dataKey="stress" fill="#6C5CE7" radius={[8, 8, 0, 0]} name="Stress Level" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Energy Level Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Energy Level Tracking</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#AAB2D5" />
                            <YAxis stroke="#AAB2D5" domain={[0, 5]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26, 31, 60, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#FFFFFF'
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#AAB2D5' }} />
                            <Bar dataKey="energy" fill="#00D1FF" radius={[8, 8, 0, 0]} name="Energy Level" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Mood Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Mood Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={moodDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {moodDistribution.map((entry, index) => (
                                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26, 31, 60, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#FFFFFF'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
