import React, { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { ActiveNote } from '@/interfaces/utils/indexedDB';
import { useCanvas } from '../canva-teste';
import { X, AlignLeft, AlignCenter, AlignRight, Ban, Square, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasGlobalStore } from '@/store/canvasStore';

interface NoteItemProps {
    note: ActiveNote;
    onUpdate: (note: ActiveNote) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent | React.PointerEvent | React.TouchEvent) => void;
    zIndex?: number;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export default function NoteItem({ note, onUpdate, onDelete, isSelected, onSelect, zIndex, onContextMenu }: NoteItemProps) {
    const { transform } = useCanvas();
    const [text, setText] = useState(note.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const setIsDraggingItem = useCanvasGlobalStore(state => state.setIsDraggingItem);
    
    const isLocalDragging = useRef(false);
    const currentPos = useRef(note.position);
    
    useEffect(() => {
        if (!isLocalDragging.current) {
            currentPos.current = note.position;
        }
    }, [note.position]);

    useEffect(() => {
        const handlePan = (e: any) => {
            if (!isLocalDragging.current) return;
            const { dx, dy, scale } = e.detail;
            const worldDx = -dx / scale;
            const worldDy = -dy / scale;

            currentPos.current = {
                x: currentPos.current.x + worldDx,
                y: currentPos.current.y + worldDy
            };
            onUpdate({ ...note, position: { ...currentPos.current } });
        };
        window.addEventListener('canvasEdgePan', handlePan);
        return () => window.removeEventListener('canvasEdgePan', handlePan);
    }, [note, onUpdate]);

    // Initialize defaults if missing
    useEffect(() => {
        if (!note.fillMode) {
            // Migration logic for existing notes
            const mode = note.transparentBg ? 'transparent' : 'filled';
            if (note.fillMode !== mode) {
                onUpdate({ ...note, fillMode: mode });
            }
        }
    }, [note.fillMode, note.transparentBg, onUpdate, note]);

    useEffect(() => {
        setText(note.content);
    }, [note.content]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text, note.width, note.fontSize]);

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event }) => {
            event.stopPropagation();
            const scaledDx = dx / transform.k;
            const scaledDy = dy / transform.k;
            currentPos.current = {
                x: currentPos.current.x + scaledDx,
                y: currentPos.current.y + scaledDy
            };
            onUpdate({ ...note, position: { ...currentPos.current } });
        },
        onDragStart: ({ event, cancel }) => {
            onSelect?.(event as any);
            setIsDraggingItem(true);
            isLocalDragging.current = true;
        },
        onDragEnd: ({ event }) => {
            event.stopPropagation();
            setIsDraggingItem(false);
            isLocalDragging.current = false;
        }
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        onUpdate({ ...note, content: e.target.value });
    };

    const handleFontSizeChange = (delta: number) => {
        const newSize = Math.max(12, Math.min(72, (note.fontSize || 16) + delta));
        onUpdate({ ...note, fontSize: newSize });
    };

    const handleFontSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            const newSize = Math.max(1, Math.min(200, val));
            onUpdate({ ...note, fontSize: newSize });
        }
    };

    const handleTextAlignChange = () => {
        const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
        const currentIndex = alignments.indexOf(note.textAlign || 'left');
        const nextIndex = (currentIndex + 1) % alignments.length;
        onUpdate({ ...note, textAlign: alignments[nextIndex] });
    };

    const handleColorChange = (color: string) => {
        onUpdate({ ...note, color, fillMode: 'filled', transparentBg: false });
    };

    const handleBorderColorChange = (color: string) => {
        onUpdate({ ...note, borderColor: color });
    };

    const handleBorderWidthChange = (width: number) => {
        onUpdate({ ...note, borderWidth: width });
    };

    const handleModeChange = (mode: 'filled' | 'transparent' | 'outlined') => {
        onUpdate({
            ...note,
            fillMode: mode,
            transparentBg: mode === 'transparent' || mode === 'outlined'
        });
    };

    const colors = [
        '#fef3c7', // Yellow
        '#fee2e2', // Red
        '#dbeafe', // Blue
        '#d1fae5', // Green
        '#f3f4f6', // Gray
        '#ede9fe', // Purple
        '#ffedd5', // Orange
        '#ffffff', // White
    ];

    const borderColors = [
        '#000000', // Black
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Green
        '#6b7280', // Gray
        '#8b5cf6', // Purple
        '#f97316', // Orange
        '#ffffff', // White
    ];

    const getTextAlignIcon = () => {
        switch (note.textAlign) {
            case 'center': return <AlignCenter size={14} />;
            case 'right': return <AlignRight size={14} />;
            default: return <AlignLeft size={14} />;
        }
    };

    // Determine styles based on mode
    const containerStyle: React.CSSProperties = {
        transform: `translate(${note.position.x * transform.k}px, ${note.position.y * transform.k}px)`,
        width: (note.width || 200) * transform.k,
        zIndex: (zIndex || 0) + (isSelected ? 10 : 0),
        position: 'absolute',
        top: 0,
        left: 0,
    };

    const textareaStyle: React.CSSProperties = {
        fontSize: (note.fontSize || 16) * transform.k,
        minHeight: 100 * transform.k,
        textAlign: note.textAlign || 'left',
        resize: 'none',
        backgroundColor: note.fillMode === 'filled' ? (note.color || '#fef3c7') : 'transparent',
        border: note.fillMode === 'outlined' ? `${(note.borderWidth || 2) * transform.k}px solid ${note.borderColor || '#000000'}` : 'none',
        color: note.fontColor || '#000000',
        boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
        pointerEvents: isSelected ? 'auto' : 'none',
    };

    return (
        <div
            id={`item-${note.id}`}
            style={containerStyle}
            className="group no-drag"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={onContextMenu}
        >
            {/* Toolbar */}
            {isSelected && (
                <div
                    className="absolute -top-12 left-0 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1.5 border border-gray-200 z-50"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Font Size */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-1">
                        <button
                            onClick={() => handleFontSizeChange(-2)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={note.fontSize || 16}
                            onChange={handleFontSizeInput}
                            className="w-8 text-center text-xs border-none outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black"
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => handleFontSizeChange(2)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        >
                            +
                        </button>
                    </div>

                    {/* Text Align */}
                    <button
                        onClick={handleTextAlignChange}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                        title="Alinhamento"
                    >
                        {getTextAlignIcon()}
                    </button>

                    {/* Style Menu (Unified) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-1.5 hover:bg-gray-100 rounded flex items-center justify-center"
                            title="Estilo"
                        >
                            <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{
                                    backgroundColor: note.fillMode === 'filled' ? (note.color || '#fef3c7') : 'transparent',
                                    background: note.fillMode === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : undefined,
                                    backgroundSize: note.fillMode === 'transparent' ? '4px 4px' : undefined,
                                    backgroundPosition: note.fillMode === 'transparent' ? '0 0, 2px 2px' : undefined,
                                    borderColor: note.fillMode === 'outlined' ? (note.borderColor || '#000000') : '#e5e7eb'
                                }}
                            />
                        </button>

                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 w-56 flex flex-col gap-3 z-50">
                                {/* Mode Selection */}
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                                    <button
                                        onClick={() => handleModeChange('filled')}
                                        className={cn(
                                            "flex-1 py-1 px-2 text-xs rounded-sm transition-colors flex items-center justify-center gap-1",
                                            note.fillMode === 'filled' || !note.fillMode ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                                        )}
                                        title="Preenchido"
                                    >
                                        <Square size={12} fill="currentColor" />
                                        Fill
                                    </button>
                                    <button
                                        onClick={() => handleModeChange('transparent')}
                                        className={cn(
                                            "flex-1 py-1 px-2 text-xs rounded-sm transition-colors flex items-center justify-center gap-1",
                                            note.fillMode === 'transparent' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                                        )}
                                        title="Transparente"
                                    >
                                        <Ban size={12} />
                                        Trans
                                    </button>
                                    <button
                                        onClick={() => handleModeChange('outlined')}
                                        className={cn(
                                            "flex-1 py-1 px-2 text-xs rounded-sm transition-colors flex items-center justify-center gap-1",
                                            note.fillMode === 'outlined' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
                                        )}
                                        title="Borda"
                                    >
                                        <Square size={12} />
                                        Out
                                    </button>
                                </div>

                                {/* Controls based on mode */}
                                {(note.fillMode === 'filled' || !note.fillMode) && (
                                    <div className="grid grid-cols-4 gap-1">
                                        {colors.map((c) => (
                                            <button
                                                key={c}
                                                className={cn(
                                                    "w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                                                    note.color === c && "ring-2 ring-offset-1 ring-blue-500 scale-105"
                                                )}
                                                style={{ backgroundColor: c }}
                                                onClick={() => handleColorChange(c)}
                                            />
                                        ))}
                                        <label className="w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 cursor-pointer overflow-hidden p-0 relative">
                                            <input
                                                type="color"
                                                value={note.color || '#ffffff'}
                                                onChange={(e) => handleColorChange(e.target.value)}
                                                className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 pointer-events-auto"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/20">
                                                <Palette size={14} className="text-gray-600" />
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {note.fillMode === 'outlined' && (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-xs font-medium text-gray-500">Cor da Borda</div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {borderColors.map((c) => (
                                                <button
                                                    key={c}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                                                        note.borderColor === c && "ring-2 ring-offset-1 ring-blue-500 scale-105"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => handleBorderColorChange(c)}
                                                />
                                            ))}
                                            <label className="w-8 h-8 rounded-full border border-gray-200 transition-transform hover:scale-110 cursor-pointer overflow-hidden p-0 relative">
                                                <input
                                                    type="color"
                                                    value={note.borderColor || '#000000'}
                                                    onChange={(e) => handleBorderColorChange(e.target.value)}
                                                    className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 pointer-events-auto"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/20">
                                                    <Palette size={14} className="text-gray-600" />
                                                </div>
                                            </label>
                                        </div>
                                        <div className="text-xs font-medium text-gray-500 mt-1">Espessura</div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={note.borderWidth || 2}
                                            onChange={(e) => handleBorderWidthChange(parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
                        title="Excluir"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Note Content */}
            <div
                {...bind()}
                className="relative touch-none"
                style={{ touchAction: 'none' }}
            >
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    className="w-full h-full p-4 outline-none rounded-lg overflow-hidden font-medium leading-relaxed"
                    style={textareaStyle}
                    placeholder="Digite sua nota..."
                    readOnly={!isSelected}
                />
            </div>
        </div>
    );
}
