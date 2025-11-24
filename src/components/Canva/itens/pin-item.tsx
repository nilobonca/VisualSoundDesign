import React from 'react';
import { MapPin } from 'lucide-react';

interface PinItemProps {
    pin: any;
    onDelete: (id: string) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

const PinItem: React.FC<PinItemProps> = ({ pin, onDelete, onContextMenu }) => {
    return (
        <div
            className={`relative group cursor-grab active:cursor-grabbing flex flex-col items-center ${!pin.enabled ? 'opacity-50 grayscale' : ''}`}
            onContextMenu={onContextMenu}
        >
            {/* Label always visible */}
            <div className="absolute -top-8 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                {pin.name}
            </div>

            <MapPin size={48} className={`${pin.enabled ? 'text-red-500' : 'text-gray-500'} drop-shadow-lg filter transition-colors`} fill="currentColor" />
        </div>
    );
};

export default PinItem;
