'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { ActiveNote } from '@/interfaces/utils/indexedDB';
import { useCanvas } from '../canva-teste';
import { cn } from '@/lib/utils';
import { Trash2, Type, Palette, Droplet, Move, Minus, Plus } from 'lucide-react';

interface NoteItemProps {
    note: ActiveNote;
    onUpdate: (note: ActiveNote) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    zIndex?: number;
}

export default function NoteItem({ note, onUpdate, onDelete, isSelected, onSelect, onContextMenu, zIndex }: NoteItemProps) {
    const { transform } = useCanvas();
    const [content, setContent] = useState(note.content);
    const [position, setPosition] = useState(note.position);
    const [size, setSize] = useState({ width: note.width, height: note.height });
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Refs for drag/resize
    const initialPosRef = useRef(note.position);

    useEffect(() => {
        setPosition(note.position);
        setSize({ width: note.width, height: note.height });
        setContent(note.content);
    }, [note]);

    const bind = useGesture({
        onDragStart: () => {
            initialPosRef.current = position;
            if (onSelect) onSelect();
        },
        onDrag: ({ offset: [ox, oy], movement: [mx, my], first, memo }) => {
            if (isEditing) return;

            const scale = transform.k;
            const newX = initialPosRef.current.x + mx / scale;
            const newY = initialPosRef.current.y + my / scale;

            setPosition({ x: newX, y: newY });
            return memo;
        },
        onDragEnd: () => {
            if (!isEditing) {
                onUpdate({ ...note, position });
            }
        }
    });

    const handleResize = (e: React.PointerEvent, direction: string) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const pointerId = e.pointerId;

        try {
            target.setPointerCapture(pointerId);
        } catch (err) {
            console.warn('Failed to capture pointer:', err);
        }

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;
        const startPos = { ...position };

        // Track current values to avoid closure staleness in handlePointerUp
        let currentWidth = startWidth;
        let currentHeight = startHeight;
        let currentX = startPos.x;
        let currentY = startPos.y;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const scale = transform.k;
            const dx = (moveEvent.clientX - startX) / scale;
            const dy = (moveEvent.clientY - startY) / scale;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newX = startPos.x;
            let newY = startPos.y;

            if (direction.includes('e')) newWidth = Math.max(50, startWidth + dx);
            if (direction.includes('s')) newHeight = Math.max(50, startHeight + dy);
            if (direction.includes('w')) {
                newWidth = Math.max(50, startWidth - dx);
                const widthChange = startWidth - newWidth;
                newX = startPos.x + widthChange;
            }
            if (direction.includes('n')) {
                newHeight = Math.max(50, startHeight - dy);
                const heightChange = startHeight - newHeight;
                newY = startPos.y + heightChange;
            }

            // Update local variables for handlePointerUp
            currentWidth = newWidth;
            currentHeight = newHeight;
            currentX = newX;
            currentY = newY;

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        };

        const handlePointerUp = () => {
            try {
                target.releasePointerCapture(pointerId);
            } catch (err) {
                console.warn('Failed to release pointer capture:', err);
            }
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);

            // Use the tracked local variables
            onUpdate({
                ...note,
                position: { x: currentX, y: currentY },
                width: currentWidth,
                height: currentHeight
            });
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (content !== note.content) {
            onUpdate({ ...note, content });
        }
    };

    const toggleTransparency = () => {
        onUpdate({ ...note, transparentBg: !note.transparentBg });
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'font') => {
        if (type === 'bg') {
            onUpdate({ ...note, color: e.target.value });
        } else {
            onUpdate({ ...note, fontColor: e.target.value });
        }
    };

    const updateFontSize = (delta: number) => {
        const currentSize = note.fontSize || 14;
        const newSize = Math.max(8, Math.min(72, currentSize + delta));
        onUpdate({ ...note, fontSize: newSize });
    };

    const [fontSizeInput, setFontSizeInput] = useState(note.fontSize?.toString() || '14');

    useEffect(() => {
        setFontSizeInput(note.fontSize?.toString() || '14');
    }, [note.fontSize]);

    const handleFontSizeCommit = () => {
        const val = parseInt(fontSizeInput);
        if (!isNaN(val) && val > 0) {
            onUpdate({ ...note, fontSize: val });
        } else {
            setFontSizeInput(note.fontSize?.toString() || '14');
        }
    };

    return (
        <div
            id={`item-${note.id}`}
            className={
                cn(
                    "absolute group no-drag",
                    isSelected ? "z-50" : ""
                )
            }
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex: isSelected ? 50 : zIndex,
                touchAction: 'none'
            }}
            onContextMenu={onContextMenu}
            onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect();
            }}
        >
            {/* Floating Toolbar */}
            {
                isSelected && (
                    <div
                        className="absolute -top-12 left-0 flex items-center gap-2 bg-white dark:bg-neutral-800 p-1.5 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-[60]"
                        onClick={(e) => e.stopPropagation()} // Prevent selection toggle
                    >
                        {/* Drag Handle */}
                        <div {...bind()} className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded text-gray-500">
                            <Move size={14} />
                        </div>

                        <div className="w-px h-4 bg-gray-200 dark:bg-neutral-700" />

                        {/* Font Size Control */}
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-900/50 rounded px-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); updateFontSize(-2); }}
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-600 dark:text-gray-300"
                                title="Diminuir fonte"
                            >
                                <Minus size={12} />
                            </button>
                            <input
                                type="text"
                                value={fontSizeInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow numbers and empty string
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setFontSizeInput(val);
                                    }
                                }}
                                onBlur={handleFontSizeCommit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleFontSizeCommit();
                                        (e.target as HTMLInputElement).blur();
                                    }
                                    if (e.key === 'Delete' || e.key === 'Backspace') {
                                        e.stopPropagation();
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 text-center bg-transparent text-[10px] font-medium text-gray-600 dark:text-gray-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); updateFontSize(2); }}
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-600 dark:text-gray-300"
                                title="Aumentar fonte"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        <div className="w-px h-4 bg-gray-200 dark:bg-neutral-700" />

                        {/* Font Color */}
                        <div className="relative group/color p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-pointer">
                            <Type size={14} className="text-gray-700 dark:text-gray-300" />
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                value={note.fontColor || '#000000'}
                                onChange={(e) => handleColorChange(e, 'font')}
                                title="Cor da Fonte"
                            />
                        </div>

                        {/* Background Color */}
                        <div className={cn(
                            "relative group/bg p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-pointer",
                            note.transparentBg && "opacity-50"
                        )}>
                            <Palette size={14} className="text-gray-700 dark:text-gray-300" />
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                value={note.color || '#FEF3C7'}
                                onChange={(e) => handleColorChange(e, 'bg')}
                                disabled={note.transparentBg}
                                title="Cor do Fundo"
                            />
                        </div>

                        {/* Transparency Toggle */}
                        <button
                            onClick={toggleTransparency}
                            className={cn(
                                "p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors",
                                note.transparentBg ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500"
                            )}
                            title="Fundo Transparente"
                        >
                            <Droplet size={14} />
                        </button>

                        <div className="w-px h-4 bg-gray-200 dark:bg-neutral-700" />

                        {/* Delete */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(note.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )
            }

            {/* Note Content */}
            <div
                className={cn(
                    "w-full h-full rounded-lg overflow-hidden flex flex-col transition-all duration-200 relative",
                    isSelected && "ring-2 ring-blue-500/50",
                    !note.transparentBg && "shadow-sm border",
                    !note.transparentBg ? "" : "border-transparent"
                )}
                style={{
                    backgroundColor: note.transparentBg ? 'transparent' : (note.color || '#FEF3C7'),
                    borderColor: note.transparentBg ? 'transparent' : (note.color ? 'rgba(0,0,0,0.1)' : '#FDE68A')
                }}
            >
                {/* Drag Overlay - Visible when not editing */}
                {!isEditing && (
                    <div
                        {...bind()}
                        className="absolute inset-0 z-20 cursor-move"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSelect) onSelect();
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                            // Small timeout to allow state update before focus
                            setTimeout(() => textareaRef.current?.focus(), 0);
                        }}
                    />
                )}

                <textarea
                    ref={textareaRef}
                    className="flex-1 w-full h-full p-2 bg-transparent border-none resize-none focus:outline-none text-sm font-medium leading-relaxed placeholder:text-neutral-500 dark:placeholder:text-neutral-400 relative z-10"
                    style={{
                        color: note.fontColor || '#1F2937',
                        fontFamily: note.fontFamily || 'inherit',
                        fontSize: note.fontSize ? `${note.fontSize}px` : '14px'
                    }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    onBlur={handleBlur}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="Digite aqui..."
                />
            </div>

            {/* Resize Handles (only when selected) */}
            {
                isSelected && (
                    <>
                        <div className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-se-resize z-50 shadow-sm"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleResize(e, 'se')} />
                        <div className="absolute -left-1.5 -bottom-1.5 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-sw-resize z-50 shadow-sm"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleResize(e, 'sw')} />
                        <div className="absolute -right-1.5 -top-1.5 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-ne-resize z-50 shadow-sm"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleResize(e, 'ne')} />
                        <div className="absolute -left-1.5 -top-1.5 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-nw-resize z-50 shadow-sm"
                            style={{ touchAction: 'none' }}
                            onPointerDown={(e) => handleResize(e, 'nw')} />
                    </>
                )
            }
        </div >
    );
}
