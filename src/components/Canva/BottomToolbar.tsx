'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Square, Type, ChevronUp, ChevronDown, Circle, Triangle, Hexagon, User, Ear, MousePointer2, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomToolbarProps {
    onDragStart: (e: React.DragEvent, type: string, data?: string) => void;
}

export default function BottomToolbar({ onDragStart, tool, setTool }: BottomToolbarProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [showShapeMenu, setShowShapeMenu] = useState(false);
    const [lastUsedShape, setLastUsedShape] = useState('rectangle');
    const [showPinMenu, setShowPinMenu] = useState(false);
    const [lastUsedPin, setLastUsedPin] = useState('pin');
    const shapeMenuRef = useRef<HTMLDivElement>(null);
    const pinMenuRef = useRef<HTMLDivElement>(null);
    const circleDragRef = useRef<HTMLDivElement>(null);
    const triangleDragRef = useRef<HTMLDivElement>(null);
    const hexagonDragRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
                setShowShapeMenu(false);
            }
            if (pinMenuRef.current && !pinMenuRef.current.contains(event.target as Node)) {
                setShowPinMenu(false);
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
        setShowPinMenu(false);
    };

    const handlePinContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowPinMenu(true);
        setShowShapeMenu(false);
    };

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
            {/* Hidden Drag Images */}
            <div className="absolute -top-[9999px] left-0 pointer-events-none">
                <div ref={circleDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-12 h-12 flex items-center justify-center">
                    <Circle size={30} className="text-green-600" />
                </div>
                <div ref={triangleDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-12 h-12 flex items-center justify-center">
                    <Triangle size={30} className="text-green-600" />
                </div>
                <div ref={hexagonDragRef} className="p-2 bg-green-100/50 rounded-full border-2 border-green-500 w-12 h-12 flex items-center justify-center">
                    <Hexagon size={30} className="text-green-600" />
                </div>
            </div>

            {/* Pin Selection Menu */}
            {showPinMenu && (
                <div
                    ref={pinMenuRef}
                    className="absolute bottom-16 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 p-2 flex gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2"
                >
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'pin', 'pin');
                            setLastUsedPin('pin');
                        }}
                        onDragEnd={() => setShowPinMenu(false)}
                        onClick={() => {
                            setLastUsedPin('pin');
                            setShowPinMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Pin Padrão"
                    >
                        <MapPin size={20} className="text-gray-700 dark:text-neutral-200" />
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'pin', 'person');
                            setLastUsedPin('person');
                        }}
                        onDragEnd={() => setShowPinMenu(false)}
                        onClick={() => {
                            setLastUsedPin('person');
                            setShowPinMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Pessoa"
                    >
                        <User size={20} className="text-gray-700 dark:text-neutral-200" />
                    </div>
                    <div
                        draggable
                        onDragStart={(e) => {
                            onDragStart(e, 'pin', 'ear');
                            setLastUsedPin('ear');
                        }}
                        onDragEnd={() => setShowPinMenu(false)}
                        onClick={() => {
                            setLastUsedPin('ear');
                            setShowPinMenu(false);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing flex flex-col items-center gap-1"
                        title="Ouvido"
                    >
                        <Ear size={20} className="text-gray-700 dark:text-neutral-200" />
                    </div>
                </div>
            )}

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

                    </div>
                </div>
            )}

            {/* Main Toolbar */}
            <div className={cn(
                "bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-gray-200 dark:border-neutral-700 transition-all duration-300 overflow-hidden",
                isOpen ? "px-4 py-2" : "px-2 py-2"
            )}>
                {isOpen ? (
                    <div className="flex items-center gap-3.5">
                        
                        {/* Tool: Cursor */}
                        {setTool && (
                            <button
                                onClick={() => setTool('cursor')}
                                className={`p-2 rounded-full transition-colors ${tool === 'cursor' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
                                title="Cursor"
                            >
                                <MousePointer2 size={20} />
                            </button>
                        )}
                        {/* Tool: Wall */}
                        {setTool && (
                            <button
                                onClick={() => setTool(tool === 'wall' ? 'cursor' : 'wall')}
                                className={`p-2 rounded-full transition-colors ${tool === 'wall' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
                                title="Desenhar Parede (Barreira de Som)"
                            >
                                <PenTool size={20} />
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300 dark:bg-neutral-700"></div>

                        {/* Pin */}
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'pin', lastUsedPin)}
                            onContextMenu={handlePinContextMenu}
                            className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform relative"
                            title="Arrastar Pin (Botão direito para opções)"
                        >
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                {lastUsedPin === 'pin' && <MapPin size={20} className="text-blue-600 dark:text-blue-400" />}
                                {lastUsedPin === 'person' && <User size={20} className="text-blue-600 dark:text-blue-400" />}
                                {lastUsedPin === 'ear' && <Ear size={20} className="text-blue-600 dark:text-blue-400" />}
                            </div>

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
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                {lastUsedShape === 'rectangle' && <Square size={20} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'circle' && <Circle size={20} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'triangle' && <Triangle size={20} className="text-green-600 dark:text-green-400" />}
                                {lastUsedShape === 'hexagon' && <Hexagon size={20} className="text-green-600 dark:text-green-400" />}
                            </div>

                        </div>

                        {/* Note */}
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'note')}
                            className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                            title="Arrastar Texto"
                        >
                            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50 transition-colors">
                                <Type size={20} className="text-yellow-600 dark:text-yellow-400" />
                            </div>

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
