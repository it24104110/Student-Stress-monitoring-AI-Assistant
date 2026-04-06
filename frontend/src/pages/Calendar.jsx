import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [moodEntries, setMoodEntries] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/mood-entries');
                setMoodEntries(response.data || []);
            } catch (error) {
                console.error("Failed to load mood entries for calendar:", error);
            }
        };
        fetchEntries();
    }, []);

    const moodEmojis = {
        happy: "😊",
        neutral: "😐",
        sad: "😔",
        angry: "😠",
        excited: "😄"
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const getMoodForDay = (day) => {
        if (!day) return null;

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = date.toDateString();

        const entry = moodEntries.find(e => new Date(e.date).toDateString() === dateStr);
        return entry;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        setSelectedDay(null);
    };

    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="glass-card p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Mood Calendar</h2>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handlePrevMonth}
                        className="glass-card p-2 hover:bg-white/10 transition-colors rounded-lg"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h3 className="text-2xl font-semibold text-white">{monthName}</h3>
                    <button
                        onClick={handleNextMonth}
                        className="glass-card p-2 hover:bg-white/10 transition-colors rounded-lg"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[#AAB2D5] font-semibold py-2">
                            {day}
                        </div>
                    ))}

                    {days.map((day, index) => {
                        const mood = getMoodForDay(day);
                        const isToday = day &&
                            new Date().toDateString() ===
                            new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                        const isSelected = selectedDay === day;

                        return (
                            <button
                                key={index}
                                onClick={() => day && setSelectedDay(day)}
                                disabled={!day}
                                className={`
                  aspect-square rounded-lg p-2 transition-all
                  ${!day ? 'invisible' : ''}
                  ${isToday ? 'ring-2 ring-[#00D1FF]' : ''}
                  ${isSelected ? 'bg-[#6C5CE7] glow-purple' : 'glass-card hover:bg-white/10'}
                  ${mood ? 'border-2 border-[#6C5CE7]/50' : ''}
                `}
                            >
                                {day && (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <span className="text-white text-sm mb-1">{day}</span>
                                        {mood && (
                                            <span className="text-2xl">{moodEmojis[mood.mood]}</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Day Details */}
                {selectedDay && (
                    <div className="glass-card p-6 border-2 border-[#6C5CE7]/50">
                        <h4 className="text-xl font-semibold text-white mb-4">
                            {currentDate.toLocaleDateString('en-US', { month: 'long' })} {selectedDay}
                        </h4>

                        {(() => {
                            const mood = getMoodForDay(selectedDay);
                            if (!mood) {
                                return <p className="text-[#AAB2D5]">No mood entry for this day.</p>;
                            }

                            return (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{moodEmojis[mood.mood]}</span>
                                        <span className="text-white text-lg capitalize">{mood.mood}</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="glass-card p-3 text-center">
                                            <p className="text-[#AAB2D5] text-sm">Stress</p>
                                            <p className="text-white text-xl font-semibold">{mood.stressLevel}/5</p>
                                        </div>
                                        <div className="glass-card p-3 text-center">
                                            <p className="text-[#AAB2D5] text-sm">Energy</p>
                                            <p className="text-white text-xl font-semibold">{mood.energyLevel}/5</p>
                                        </div>
                                        <div className="glass-card p-3 text-center">
                                            <p className="text-[#AAB2D5] text-sm">Sleep</p>
                                            <p className="text-white text-xl font-semibold">{mood.sleepQuality}/5</p>
                                        </div>
                                    </div>

                                    {mood.notes && (
                                        <div className="mt-4">
                                            <p className="text-[#AAB2D5] text-sm mb-2">Notes:</p>
                                            <p className="text-white">{mood.notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
