import { ActivePin } from '@/interfaces/utils/indexedDB';
import { MapPin, User, Ear } from 'lucide-react';

interface PinItemProps {
    pin: ActivePin;
    onContextMenu: (e: React.MouseEvent) => void;
    onSelect?: () => void;
}

const PinItem: React.FC<PinItemProps> = ({ pin, onContextMenu, onSelect }) => {
    const Icon = pin.icon === 'person' ? User : pin.icon === 'ear' ? Ear : MapPin;

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

            <Icon
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
