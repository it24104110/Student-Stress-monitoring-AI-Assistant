import { useState, useRef } from 'react';
import { X, Palette } from 'lucide-react';

export default function StickyNote({ note, onUpdate, onDelete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const noteRef = useRef(null);

    const colors = ['#FFD93D', '#6BCF7F', '#FF6B9D', '#A78BFA', '#60A5FA', '#FFA500'];

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'TEXTAREA') return;

        setIsDragging(true);
        const rect = noteRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const canvas = noteRef.current.closest('.relative');
        const rect = canvas.getBoundingClientRect();

        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;

        onUpdate({ x, y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <>
            <div
                ref={noteRef}
                className="sticky-note absolute cursor-move"
                style={{
                    left: `${note.x}px`,
                    top: `${note.y}px`,
                    transform: `rotate(${note.rotation}deg)`,
                    width: '200px',
                    backgroundColor: note.color,
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    zIndex: isDragging ? 50 : 10
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Controls */}
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Palette className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                        onClick={onDelete}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <X className="w-4 h-4 text-gray-700" />
                    </button>
                </div>

                {/* Color Picker */}
                {showColorPicker && (
                    <div
                        className="flex gap-1 mb-2 flex-wrap"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    onUpdate({ color });
                                    setShowColorPicker(false);
                                }}
                                className="w-6 h-6 rounded border-2 border-gray-700 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                )}

                {/* Text */}
                {isEditing ? (
                    <textarea
                        value={note.text}
                        onChange={(e) => onUpdate({ text: e.target.value })}
                        onBlur={() => setIsEditing(false)}
                        className="w-full bg-transparent border-none outline-none resize-none text-gray-800"
                        style={{ fontFamily: 'Comic Sans MS, cursive', fontSize: '14px' }}
                        rows={4}
                        autoFocus
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="text-gray-800 cursor-text whitespace-pre-wrap break-words"
                        style={{ fontFamily: 'Comic Sans MS, cursive', fontSize: '14px' }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {note.text}
                    </div>
                )}
            </div>
        </>
    );
}
