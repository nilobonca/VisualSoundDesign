'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    options: {
        label: string;
        onClick: () => void;
        icon?: string;
    }[];
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y });

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

    // Use a portal to render the menu at the document root level
    // This avoids issues with parent transforms (like in LayerManager) affecting fixed positioning
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white dark:bg-neutral-800 shadow-2xl rounded-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[180px] md:min-w-[200px] z-[9999] overflow-hidden"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => {
                        option.onClick();
                        onClose();
                    }}
                    className="w-full text-left px-4 py-3 md:py-2 hover:bg-blue-50 dark:hover:bg-neutral-700 active:bg-blue-100 dark:active:bg-neutral-600 transition-colors flex items-center gap-3 text-sm md:text-base touch-manipulation text-gray-700 dark:text-neutral-200"
                    style={{ minHeight: '44px' }} // Touch-friendly minimum height
                >
                    {option.icon && <span className="text-lg md:text-base">{option.icon}</span>}
                    <span className="font-medium">{option.label}</span>
                </button>
            ))}
        </div>,
        document.body
    );
}
