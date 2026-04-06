export default function RatingSlider({ label, value, onChange, icon }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{icon}</span>
                <label className="text-white">{label}</label>
            </div>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min="1"
                    max="5"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#6C5CE7]"
                    style={{
                        background: `linear-gradient(to right, #6C5CE7 0%, #6C5CE7 ${(value - 1) * 25}%, rgba(255,255,255,0.1) ${(value - 1) * 25}%, rgba(255,255,255,0.1) 100%)`
                    }}
                />
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => onChange(num)}
                            className={`w-8 h-8 rounded-lg transition-all ${value === num
                                    ? 'bg-[#6C5CE7] text-white glow-purple'
                                    : 'bg-white/5 text-[#AAB2D5] hover:bg-white/10'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
