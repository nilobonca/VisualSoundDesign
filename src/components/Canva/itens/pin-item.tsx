import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ActivePin } from '@/interfaces/utils/indexedDB';
import { useCanvas } from '../canva-teste';

interface PinItemProps {
    pin: ActivePin;
    onUpdate: (pin: ActivePin) => void;
    onDelete: (id: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isSelected?: boolean;
    onSelect?: () => void;
}

const PinItem: React.FC<PinItemProps> = ({ pin, onUpdate, onDelete, onContextMenu, isSelected, onSelect }) => {
    const { transform } = useCanvas();

    return (
        <div
            className={`relative group cursor-grab active:cursor-grabbing flex flex-col items-center ${!pin.enabled ? 'opacity-50 grayscale' : ''}`}
            onContextMenu={onContextMenu}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
            }}
            style={{ opacity: pin.opacity !== undefined ? pin.opacity : 1 }}
        >
            {/* Label always visible */}
            <div className="absolute -top-8 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                {pin.name}
            </div>

            <MapPin
                size={48}
                className="drop-shadow-lg transition-colors"
                style={{
                    color: pin.enabled ? (pin.color || '#ef4444') : '#6b7280',
                    fill: pin.enabled ? 'currentColor' : 'none'
                }}
            />


        </div>
    );
};

export default PinItem;
