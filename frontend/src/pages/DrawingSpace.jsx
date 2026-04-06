import { useState, useRef, useEffect } from 'react';
import { Palette, Eraser, Download, Trash2, Plus } from 'lucide-react';
import StickyNote from '../components/StickyNote';

export default function DrawingSpace() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#6C5CE7');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
    const [stickyNotes, setStickyNotes] = useState([]);

    const colors = ['#6C5CE7', '#7D6BFF', '#00D1FF', '#FFFFFF', '#AAB2D5', '#FF6B9D', '#FFA500'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1A1F3C';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        if (tool === 'eraser') {
            ctx.strokeStyle = '#1A1F3C';
            ctx.lineWidth = brushSize * 2;
        } else {
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = brushSize;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1A1F3C';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const exportCanvas = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = 'mood-drawing.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    const addStickyNote = () => {
        const newNote = {
            id: Date.now(),
            text: 'New note...',
            x: Math.random() * 300 + 50,
            y: Math.random() * 200 + 50,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 10 - 5
        };
        setStickyNotes([...stickyNotes, newNote]);
    };

    const updateStickyNote = (id, updates) => {
        setStickyNotes(stickyNotes.map(note =>
            note.id === id ? { ...note, ...updates } : note
        ));
    };

    const deleteStickyNote = (id) => {
        setStickyNotes(stickyNotes.filter(note => note.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Collaborative Drawing Space</h2>
                <button
                    onClick={addStickyNote}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#7D6BFF] text-white rounded-lg hover:glow-purple transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Sticky Note
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Toolbar */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white">Tools</h3>

                        {/* Tool Selection */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setTool('brush')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${tool === 'brush'
                                        ? 'bg-[#6C5CE7] text-white glow-purple'
                                        : 'glass-card text-[#AAB2D5] hover:text-white'
                                    }`}
                            >
                                <Palette className="w-5 h-5" />
                                <span>Brush</span>
                            </button>

                            <button
                                onClick={() => setTool('eraser')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${tool === 'eraser'
                                        ? 'bg-[#6C5CE7] text-white glow-purple'
                                        : 'glass-card text-[#AAB2D5] hover:text-white'
                                    }`}
                            >
                                <Eraser className="w-5 h-5" />
                                <span>Eraser</span>
                            </button>
                        </div>

                        {/* Color Palette */}
                        <div>
                            <label className="block text-white mb-3">Color</label>
                            <div className="grid grid-cols-4 gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setCurrentColor(color);
                                            setTool('brush');
                                        }}
                                        className={`w-12 h-12 rounded-lg transition-all ${currentColor === color && tool === 'brush'
                                                ? 'ring-2 ring-white scale-110'
                                                : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Brush Size */}
                        <div>
                            <label className="block text-white mb-3">Brush Size: {brushSize}px</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full accent-[#6C5CE7]"
                            />
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={clearCanvas}
                                className="w-full flex items-center gap-3 px-4 py-3 glass-card text-[#AAB2D5] hover:text-white rounded-lg transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Clear Canvas</span>
                            </button>

                            <button
                                onClick={exportCanvas}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#6C5CE7] to-[#7D6BFF] text-white rounded-lg hover:glow-purple transition-all"
                            >
                                <Download className="w-5 h-5" />
                                <span>Export PNG</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="lg:col-span-3">
                    <div className="glass-card p-6">
                        <div className="relative bg-[#1A1F3C] rounded-xl overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={1000}
                                height={600}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="w-full"
                            />

                            {/* Sticky Notes */}
                            {stickyNotes.map(note => (
                                <StickyNote
                                    key={note.id}
                                    note={note}
                                    onUpdate={(updates) => updateStickyNote(note.id, updates)}
                                    onDelete={() => deleteStickyNote(note.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
