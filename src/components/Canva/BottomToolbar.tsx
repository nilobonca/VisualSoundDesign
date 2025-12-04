'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Square, StickyNote, ChevronUp, ChevronDown, Circle, Triangle, Hexagon, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomToolbarProps {
    onDragStart: (e: React.DragEvent, type: string, data?: string) => void;
}

export default function BottomToolbar({ onDragStart }: BottomToolbarProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [showShapeMenu, setShowShapeMenu] = useState(false);
    const [lastUsedShape, setLastUsedShape] = useState('rectangle');
    const shapeMenuRef = useRef<HTMLDivElement>(null);
    const circleDragRef = useRef<HTMLDivElement>(null);
    const triangleDragRef = useRef<HTMLDivElement>(null);
    const hexagonDragRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
                setShowShapeMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAreaContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowShapeMenu(true);
    };

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
            {/* Hidden Drag Images */}
            <div className="absolute -top-[9999px] left-0 pointer-events-none">
                <div ref={circleDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-16 h-16 flex items-center justify-center">
                    <Circle size={40} className="text-green-600" />
                </div>
                <div ref={triangleDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-16 h-16 flex items-center justify-center">
                    <Triangle size={40} className="text-green-600" />
                </div>
                <div ref={hexagonDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-16 h-16 flex items-center justify-center">
                    <Hexagon size={40} className="text-green-600" />
                </div>
            </div>

            {/* Shape Selection Menu */}
            {showShapeMenu && (
                <div
                    ref={shapeMenuRef}
                    className="absolute bottom-16 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 p-2 flex gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2"
                >
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'area', 'rectangle');
                            setLastUsedShape('rectangle');
                        }}
                        onDragEnd={() => setShowShapeMenu(false)}
                        onClick={() => {
                            setLastUsedShape('rectangle');
                            setShowShapeMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Retângulo"
                    >
                        <Square size={20} className="text-gray-700 dark:text-neutral-200" />
                        <span className="text-[10px] text-gray-500">Rect</span>
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'area', 'circle');
                            setLastUsedShape('circle');
                            if (circleDragRef.current) {
                                e.dataTransfer.setDragImage(circleDragRef.current, 32, 32);
                            }
                        }}
                        onDragEnd={() => setShowShapeMenu(false)}
                        onClick={() => {
                            setLastUsedShape('circle');
                            setShowShapeMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Círculo"
                    >
                        <Circle size={20} className="text-gray-700 dark:text-neutral-200" />
                        <span className="text-[10px] text-gray-500">Circ</span>
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'area', 'triangle');
                            setLastUsedShape('triangle');
                            if (triangleDragRef.current) {
                                e.dataTransfer.setDragImage(triangleDragRef.current, 32, 32);
                            }
                        }}
                        onDragEnd={() => setShowShapeMenu(false)}
                        onClick={() => {
                            setLastUsedShape('triangle');
                            setShowShapeMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Triângulo"
                    >
                        <Triangle size={20} className="text-gray-700 dark:text-neutral-200" />
                        <span className="text-[10px] text-gray-500">Tri</span>
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'area', 'hexagon');
                            setLastUsedShape('hexagon');
                            if (hexagonDragRef.current) {
                                e.dataTransfer.setDragImage(hexagonDragRef.current, 32, 32);
                            }
                        }}
                        onDragEnd={() => setShowShapeMenu(false)}
                        onClick={() => {
                            setLastUsedShape('hexagon');
                            setShowShapeMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Hexágono"
                    >
                        <Hexagon size={20} className="text-gray-700 dark:text-neutral-200" />
                        <span className="text-[10px] text-gray-500">Hex</span>
                    </div>
                </div>
            )}

            {/* Main Toolbar */}
            <div className={cn(
                "bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-gray-200 dark:border-neutral-700 transition-all duration-300 overflow-hidden",
                isOpen ? "px-6 py-3" : "px-2 py-2"
            )}>
                {isOpen ? (
                    <div className="flex items-center gap-6">
                        {/* Pin */}
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'pin')}
                            className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                            title="Arrastar Pin"
                        >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                <MapPin size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Pin</span>
                        </div>

                        {/* Area */}
                        <div
                            draggable
                            onDragStart={(e) => {
                                onDragStart(e, 'area', lastUsedShape);
                                if (lastUsedShape === 'circle' && circleDragRef.current) {
                                    e.dataTransfer.setDragImage(circleDragRef.current, 32, 32);
                                } else if (lastUsedShape === 'triangle' && triangleDragRef.current) {
                                    e.dataTransfer.setDragImage(triangleDragRef.current, 32, 32);
                                } else if (lastUsedShape === 'hexagon' && hexagonDragRef.current) {
                                    e.dataTransfer.setDragImage(hexagonDragRef.current, 32, 32);
                                }
                            }}
                            onContextMenu={handleAreaContextMenu}
                            className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform relative"
                            title="Arrastar Área (Botão direito para formas)"
                        >
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                {lastUsedShape === 'rectangle' && <Square size={24} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'circle' && <Circle size={24} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'triangle' && <Triangle size={24} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'hexagon' && <Hexagon size={24} className="text-green-600 dark:text-green-400" />}
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                {lastUsedShape === 'rectangle' ? 'Área' :
                                    lastUsedShape === 'circle' ? 'Círculo' :
                                        lastUsedShape === 'triangle' ? 'Triângulo' : 'Hexágono'}
                            </span>
                        </div>

                        {/* Note */}
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'note')}
                            className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                            title="Arrastar Nota"
                        >
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50 transition-colors">
                                <StickyNote size={24} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Nota</span>
                        </div>

                        <div className="w-px h-8 bg-gray-200 dark:bg-neutral-700 mx-2" />

                        {/* Toggle Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                        >
                            <ChevronDown size={20} className="text-gray-500" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                    >
                        <ChevronUp size={20} className="text-gray-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
