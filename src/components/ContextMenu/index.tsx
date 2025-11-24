'use client';

import React, { useEffect, useRef } from 'react';

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[180px] z-50"
            style={{
                left: `${x}px`,
                top: `${y}px`,
            }}
        >
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => {
                        option.onClick();
                        onClose();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm"
                >
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
}
