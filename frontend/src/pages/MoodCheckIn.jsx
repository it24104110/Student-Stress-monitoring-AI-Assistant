import { useState } from 'react';
import axios from 'axios';
import MoodSelector from '../components/MoodSelector';
import RatingSlider from '../components/RatingSlider';
import { toast } from 'sonner';

export default function MoodCheckIn() {
    const [selectedMood, setSelectedMood] = useState(null);
    const [stressLevel, setStressLevel] = useState(3);
    const [energyLevel, setEnergyLevel] = useState(3);
    const [sleepQuality, setSleepQuality] = useState(3);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMood) {
            toast.error('Please select a mood');
            return;
        }

        const entry = {
            mood: selectedMood,
            stressLevel,
            energyLevel,
            sleepQuality,
            notes,
        };

        try {
            await axios.post('http://localhost:8080/api/mood-entries', entry);
            toast.success('Mood check-in saved to database successfully! 🎉');

            // Reset form
            setSelectedMood(null);
            setStressLevel(3);
            setEnergyLevel(3);
            setSleepQuality(3);
            setNotes('');
        } catch (error) {
            console.error('Error saving mood entry:', error);
            toast.error('Failed to save mood check-in to database.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass-card p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Daily Mood Check-In</h2>
                    <p className="text-[#AAB2D5]">Track your emotional wellbeing today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Mood Selection */}
                    <div>
                        <label className="block text-white mb-4">How are you feeling today?</label>
                        <MoodSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} />
                    </div>

                    {/* Stress Level */}
                    <RatingSlider
                        label="Stress Level"
                        value={stressLevel}
                        onChange={setStressLevel}
                        icon="😰"
                    />

                    {/* Energy Level */}
                    <RatingSlider
                        label="Energy Level"
                        value={energyLevel}
                        onChange={setEnergyLevel}
                        icon="⚡"
                    />

                    {/* Sleep Quality */}
                    <RatingSlider
                        label="Sleep Quality"
                        value={sleepQuality}
                        onChange={setSleepQuality}
                        icon="😴"
                    />

                    {/* Optional Notes */}
                    <div>
                        <label className="block text-white mb-2">Optional Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full glass-input p-4 min-h-[120px] resize-none focus:outline-none focus:border-[#6C5CE7]"
                            placeholder="How are you feeling? Any thoughts to share..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full btn-gradient py-4 rounded-xl font-semibold transition-all duration-300 transform"
                    >
                        Save Today's Check-In
                    </button>
                </form>
            </div>
        </div>
    );
}
