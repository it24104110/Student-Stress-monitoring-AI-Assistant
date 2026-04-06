export default function MoodSelector({ selectedMood, onSelectMood }) {
    const moods = [
        { emoji: "😊", label: "Happy", value: "happy" },
        { emoji: "😐", label: "Neutral", value: "neutral" },
        { emoji: "😔", label: "Sad", value: "sad" },
        { emoji: "😠", label: "Angry", value: "angry" },
        { emoji: "😄", label: "Excited", value: "excited" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {moods.map((mood) => (
                <button
                    key={mood.value}
                    type="button"
                    onClick={() => onSelectMood(mood.value)}
                    className={`mood-button glass-card p-6 flex flex-col items-center gap-2 border-2 ${selectedMood === mood.value ? 'selected border-[#6C5CE7]' : 'border-transparent'
                        }`}
                >
                    <span className="text-4xl">{mood.emoji}</span>
                    <span className="text-white text-sm">{mood.label}</span>
                </button>
            ))}
        </div>
    );
}
