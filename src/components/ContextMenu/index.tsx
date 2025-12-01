'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ChevronRight, Search } from 'lucide-react';

interface ContextMenuOption {
    label: string;
    onClick: () => void;
    icon?: string;
    disabled?: boolean;
    subMenu?: ContextMenuOption[];
    searchable?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    options: ContextMenuOption[];
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y });
    const [activeSubMenuIndex, setActiveSubMenuIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = x;
            let adjustedY = y;

            // Adjust horizontal position if menu would go off-screen
            if (x + menuRect.width > viewportWidth) {
                adjustedX = viewportWidth - menuRect.width - 10; // 10px margin
            }

            // Adjust vertical position if menu would go off-screen
            if (y + menuRect.height > viewportHeight) {
                adjustedY = viewportHeight - menuRect.height - 10; // 10px margin
            }

            // Ensure menu doesn't go off the left edge
            if (adjustedX < 10) {
                adjustedX = 10;
            }

            // Ensure menu doesn't go off the top edge
            if (adjustedY < 10) {
                adjustedY = 10;
            }

            setPosition({ x: adjustedX, y: adjustedY });
        }
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Reset search when submenu changes
    useEffect(() => {
        setSearchTerm('');
    }, [activeSubMenuIndex]);

    // Use a portal to render the menu at the document root level
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white dark:bg-neutral-800 shadow-2xl rounded-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[180px] md:min-w-[200px] z-[9999]"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setActiveSubMenuIndex(index)}
                    onMouseLeave={() => setActiveSubMenuIndex(null)}
                >
                    <button
                        disabled={option.disabled}
                        onClick={() => {
                            if (option.disabled) return;
                            if (option.subMenu) return; // Don't close on submenu click
                            option.onClick();
                            onClose();
                        }}
                        className={`w-full text-left px-4 py-3 md:py-2 transition-colors flex items-center justify-between text-sm md:text-base touch-manipulation
                        ${option.disabled
                                ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-neutral-900'
                                : 'hover:bg-blue-50 dark:hover:bg-neutral-700 active:bg-blue-100 dark:active:bg-neutral-600 text-gray-700 dark:text-neutral-200'
                            }`}
                        style={{ minHeight: '44px' }}
                    >
                        <div className="flex items-center gap-3">
                            {option.icon && <span className="text-lg md:text-base">{option.icon}</span>}
                            <span className="font-medium">{option.label}</span>
                        </div>
                        {option.subMenu && <ChevronRight size={16} />}
                    </button>

                    {/* Submenu */}
                    {option.subMenu && activeSubMenuIndex === index && (
                        <div
                            className="absolute top-0 left-full ml-1 bg-white dark:bg-neutral-800 shadow-2xl rounded-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[180px] md:min-w-[200px] max-h-[300px] overflow-y-auto flex flex-col"
                        >
                            {option.searchable && (
                                <div className="p-2 sticky top-0 bg-white dark:bg-neutral-800 z-10 border-b border-gray-100 dark:border-neutral-700">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full pl-7 pr-2 py-1 text-xs bg-gray-100 dark:bg-neutral-900 rounded border-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {option.subMenu
                                .filter(subOption =>
                                    !option.searchable ||
                                    subOption.label.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((subOption, subIndex) => (
                                    <button
                                        key={subIndex}
                                        disabled={subOption.disabled}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (subOption.disabled) return;
                                            subOption.onClick();
                                            onClose();
                                        }}
                                        className={`w-full text-left px-4 py-3 md:py-2 transition-colors flex items-center gap-3 text-sm md:text-base touch-manipulation shrink-0
                                    ${subOption.disabled
                                                ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-neutral-900'
                                                : 'hover:bg-blue-50 dark:hover:bg-neutral-700 active:bg-blue-100 dark:active:bg-neutral-600 text-gray-700 dark:text-neutral-200'
                                            }`}
                                        style={{ minHeight: '44px' }}
                                    >
                                        {subOption.icon && <span className="text-lg md:text-base">{subOption.icon}</span>}
                                        <span className="font-medium truncate">{subOption.label}</span>
                                    </button>
                                ))}

                            {option.searchable && option.subMenu.filter(subOption => subOption.label.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                    Nenhum resultado
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>,
        document.body
    );
}


