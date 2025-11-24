import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Edit2, Crop, Check } from 'lucide-react';
import { ActiveImage } from '@/interfaces/utils/indexedDB';

interface ImageItemProps {
    image: ActiveImage;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onUpdate: (image: ActiveImage) => void;
    isEditing?: boolean;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, onDelete, onEdit, onUpdate, isEditing = false }) => {
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropArea] = useState({
        x: image.crop?.x || 0,
        y: image.crop?.y || 0,
        width: image.crop?.width || 100,
        height: image.crop?.height || 100
    });
    const [imageRect, setImageRect] = useState<DOMRect | null>(null);
    const imageRef = React.useRef<HTMLImageElement>(null);

    // Update position when cropping
    useEffect(() => {
        if (isCropping && imageRef.current) {
            const updatePosition = () => {
                if (imageRef.current) {
                    setImageRect(imageRef.current.getBoundingClientRect());
                }
            };

            const interval = setInterval(updatePosition, 100);
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);

            return () => {
                clearInterval(interval);
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isCropping]);

    // Apply transformations ONLY to the image, not container
    const imageTransform = `
    rotate(${image.rotation || 0}deg)
    scale(${image.scale || 1})
    scaleX(${image.flipH ? -1 : 1})
    scaleY(${image.flipV ? -1 : 1})
  `;

    const filter = `
    brightness(${100 + (image.brightness || 0)}%)
    contrast(${100 + (image.contrast || 0)}%)
    opacity(${(image.opacity || 100)}%)
  `;

    // Apply crop using clip-path
    const clipPath = image.crop
        ? `inset(${image.crop.y}% ${100 - image.crop.x - image.crop.width}% ${100 - image.crop.y - image.crop.height}% ${image.crop.x}%)`
        : 'none';

    const handleCropStart = () => {
        if (imageRef.current) {
            setImageRect(imageRef.current.getBoundingClientRect());
        }
        setIsCropping(true);
        setCropArea({
            x: image.crop?.x || 0,
            y: image.crop?.y || 0,
            width: image.crop?.width || 100,
            height: image.crop?.height || 100
        });
    };

    const handleCropApply = () => {
        onUpdate({
            ...image,
            crop: cropArea
        });
        setIsCropping(false);
    };

    const handleCropCancel = () => {
        setIsCropping(false);
    };

    // Crop UI Portal
    const CropOverlay = isCropping && imageRect ? ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] prevent-item-drag"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
        >
            {/* Action Buttons */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-[10000]">
                <button
                    onClick={handleCropCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 shadow-lg font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleCropApply}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 flex items-center gap-2 shadow-lg font-medium"
                >
                    <Check size={16} />
                    Aplicar Crop
                </button>
            </div>

            {/* Crop Rectangle */}
            <div
                className="absolute border-4 border-white shadow-lg prevent-item-drag"
                style={{
                    left: imageRect.left + (imageRect.width * cropArea.x / 100),
                    top: imageRect.top + (imageRect.height * cropArea.y / 100),
                    width: (imageRect.width * cropArea.width / 100),
                    height: (imageRect.height * cropArea.height / 100),
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    cursor: 'move',
                    touchAction: 'none' // Important for pointer events
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault(); // Prevent scrolling
                    const target = e.currentTarget;
                    target.setPointerCapture(e.pointerId);

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startCropX = cropArea.x;
                    const startCropY = cropArea.y;

                    const handlePointerMove = (moveE: PointerEvent) => {
                        moveE.stopPropagation();
                        const deltaX = ((moveE.clientX - startX) / imageRect.width) * 100;
                        const deltaY = ((moveE.clientY - startY) / imageRect.height) * 100;

                        setCropArea(prev => ({
                            ...prev,
                            x: Math.max(0, Math.min(100 - prev.width, startCropX + deltaX)),
                            y: Math.max(0, Math.min(100 - prev.height, startCropY + deltaY))
                        }));
                    };

                    const handlePointerUp = (upE: PointerEvent) => {
                        upE.stopPropagation();
                        target.releasePointerCapture(upE.pointerId);
                        target.removeEventListener('pointermove', handlePointerMove as any);
                        target.removeEventListener('pointerup', handlePointerUp as any);
                    };

                    target.addEventListener('pointermove', handlePointerMove as any);
                    target.addEventListener('pointerup', handlePointerUp as any);
                }}
            >
                {/* Corner Handles */}
                {['nw', 'ne', 'sw', 'se'].map((corner) => (
                    <div
                        key={corner}
                        className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:scale-125 transition-transform shadow-lg prevent-item-drag"
                        style={{
                            [corner.includes('n') ? 'top' : 'bottom']: '-10px',
                            [corner.includes('w') ? 'left' : 'right']: '-10px',
                            cursor: corner.includes('n') && corner.includes('w') ? 'nw-resize' :
                                corner.includes('n') && corner.includes('e') ? 'ne-resize' :
                                    corner.includes('s') && corner.includes('w') ? 'sw-resize' : 'se-resize',
                            touchAction: 'none'
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const target = e.currentTarget;
                            target.setPointerCapture(e.pointerId);

                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startCrop = { ...cropArea };

                            const handlePointerMove = (moveE: PointerEvent) => {
                                moveE.stopPropagation();
                                const deltaX = ((moveE.clientX - startX) / imageRect.width) * 100;
                                const deltaY = ((moveE.clientY - startY) / imageRect.height) * 100;

                                setCropArea(prev => {
                                    let newCrop = { ...prev };

                                    if (corner.includes('w')) {
                                        const newX = Math.max(0, Math.min(startCrop.x + startCrop.width, startCrop.x + deltaX));
                                        newCrop.width = startCrop.width + (startCrop.x - newX);
                                        newCrop.x = newX;
                                    } else {
                                        newCrop.width = Math.max(1, Math.min(100 - startCrop.x, startCrop.width + deltaX));
                                    }

                                    if (corner.includes('n')) {
                                        const newY = Math.max(0, Math.min(startCrop.y + startCrop.height, startCrop.y + deltaY));
                                        newCrop.height = startCrop.height + (startCrop.y - newY);
                                        newCrop.y = newY;
                                    } else {
                                        newCrop.height = Math.max(1, Math.min(100 - startCrop.y, startCrop.height + deltaY));
                                    }

                                    return newCrop;
                                });
                            };

                            const handlePointerUp = (upE: PointerEvent) => {
                                upE.stopPropagation();
                                target.releasePointerCapture(upE.pointerId);
                                target.removeEventListener('pointermove', handlePointerMove as any);
                                target.removeEventListener('pointerup', handlePointerUp as any);
                            };

                            target.addEventListener('pointermove', handlePointerMove as any);
                            target.addEventListener('pointerup', handlePointerUp as any);
                        }}
                    />
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {/* Container does NOT have transformations - stays stable */}
            <div
                className={`relative group ${isEditing ? 'ring-4 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
            >
                {/* BLOCKER: Prevents DraggableItem from receiving events when cropping */}
                {isCropping && (
                    <div
                        className="absolute inset-0 z-[9998] prevent-item-drag"
                        style={{
                            width: '100%',
                            height: '100%',
                            cursor: 'not-allowed',
                            touchAction: 'none'
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerMove={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseMove={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}

                {/* Buttons */}
                <div
                    className="absolute z-[9999] opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                    style={{
                        top: image.crop ? `${image.crop.y}%` : '-8px',
                        right: image.crop ? `${100 - (image.crop.x + image.crop.width)}%` : '-8px',
                        transform: image.crop ? 'translate(50%, -50%)' : 'none'
                    }}
                >
                    {!isCropping && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCropStart();
                                }}
                                className="bg-purple-500 text-white rounded-full p-1 hover:bg-purple-600 shadow-md"
                                title="Crop imagem"
                            >
                                <Crop size={12} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(image.id);
                                }}
                                className={`text-white rounded-full p-1 shadow-md ${isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                title={isEditing ? "Editando..." : "Editar imagem"}
                            >
                                <Edit2 size={12} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(image.id);
                                }}
                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                title="Deletar imagem"
                            >
                                <X size={12} />
                            </button>
                        </>
                    )}
                </div>

                {isEditing && !isCropping && (
                    <div
                        className="absolute bg-blue-500 text-white text-xs px-2 py-0.5 rounded-t font-medium whitespace-nowrap"
                        style={{
                            top: image.crop ? `${image.crop.y}%` : '-24px',
                            left: image.crop ? `${image.crop.x}%` : '0px',
                            transform: image.crop ? 'translateY(-100%)' : 'none'
                        }}
                    >
                        ✏️ Editando
                    </div>
                )}

                {/* Image with transformations applied directly */}
                <img
                    ref={imageRef}
                    src={image.image.url}
                    alt={image.image.name}
                    className="max-w-[300px] max-h-[300px] object-contain rounded-md shadow-lg pointer-events-none"
                    style={{
                        transform: imageTransform,
                        filter,
                        clipPath: isCropping ? 'none' : clipPath,
                        transition: 'transform 0.2s ease-out, filter 0.2s ease-out, clip-path 0.2s ease-out'
                    }}
                />
            </div>

            {CropOverlay}
        </>
    );
};

export default ImageItem;
