import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Edit2, Crop, Check } from 'lucide-react';
import { ActiveImage } from '@/interfaces/utils/indexedDB';
import { useCanvas } from '../canva-teste';

interface ImageItemProps {
    image: ActiveImage;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onUpdate: (image: ActiveImage) => void;
    isEditing?: boolean;
    onContextMenu?: (e: React.MouseEvent) => void;
    onCropStart?: () => void;
    onCropEnd?: () => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, onDelete, onEdit, onUpdate, isEditing = false, onContextMenu, onCropStart, onCropEnd }) => {
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropArea] = useState({
        x: image.crop?.x || 0,
        y: image.crop?.y || 0,
        width: image.crop?.width || 100,
        height: image.crop?.height || 100
    });
    const [imageRect, setImageRect] = useState<DOMRect | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const imageRef = React.useRef<HTMLImageElement>(null);
    
    const [showButtons, setShowButtons] = useState(false);
    const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setShowButtons(true);
    };

    const handleMouseLeave = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            setShowButtons(false);
            hideTimeoutRef.current = null;
        }, 500);
    };

    const { transform } = useCanvas();

    const currentScale = image.scale || 1;

    // Update position when cropping
    useEffect(() => {
        if (isCropping && imageRef.current) {
            const updatePosition = () => {
                if (imageRef.current) {
                    setImageRect(imageRef.current.getBoundingClientRect());
                }
            };

            // Call immediately to capture state after render
            updatePosition();

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

    // Apply transformations
    // Scale is now applied to the container size, not the image transform
    // When cropping, we disable transforms to ensure coordinate systems match
    const imageTransform = isCropping ? 'none' : `
    scaleX(${image.flipH ? -1 : 1})
    scaleY(${image.flipV ? -1 : 1})
  `;

    // Calculate transform origin based on crop center
    const transformOrigin = image.crop
        ? `${image.crop.x + (image.crop.width / 2)}% ${image.crop.y + (image.crop.height / 2)}%`
        : 'center center';

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
        setIsCropping(true);
        if (onCropStart) onCropStart();
        // Note: We don't set imageRect here because we need to wait for the re-render 
        // that removes the rotation transform before capturing the rect.
        // The useEffect will handle it.
        setCropArea({
            x: image.crop?.x || 0,
            y: image.crop?.y || 0,
            width: image.crop?.width || 100,
            height: image.crop?.height || 100
        });
    };

    const handleCropApply = () => {
        // Calculate the shift in position due to crop
        const fullWidth = dimensions.width * currentScale;
        const fullHeight = dimensions.height * currentScale;

        const oldX = image.crop?.x || 0;
        const oldY = image.crop?.y || 0;

        // Calculate pixel delta
        const deltaX = fullWidth * ((cropArea.x - oldX) / 100);
        const deltaY = fullHeight * ((cropArea.y - oldY) / 100);

        onUpdate({
            ...image,
            crop: cropArea,
            position: {
                x: Number(image.position.x) + deltaX,
                y: Number(image.position.y) + deltaY
            }
        });
        setIsCropping(false);
        if (onCropEnd) onCropEnd();
    };

    const handleCropCancel = () => {
        setIsCropping(false);
        if (onCropEnd) onCropEnd();
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
                        target.removeEventListener('pointermove', handlePointerMove);
                        target.removeEventListener('pointerup', handlePointerUp);
                    };

                    target.addEventListener('pointermove', handlePointerMove);
                    target.addEventListener('pointerup', handlePointerUp);
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
                                    const newCrop = { ...prev };

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
                                target.removeEventListener('pointermove', handlePointerMove);
                                target.removeEventListener('pointerup', handlePointerUp);
                            };

                            target.addEventListener('pointermove', handlePointerMove);
                            target.addEventListener('pointerup', handlePointerUp);
                        }}
                    />
                ))}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {/* Container now scales physically */}
            <div
                className={`relative group ${isEditing ? 'ring-4 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
                onContextMenu={onContextMenu}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    width: dimensions.width ? (isCropping ? (dimensions.width * currentScale) : (dimensions.width * currentScale * (cropArea.width / 100))) : 'auto',
                    height: dimensions.height ? (isCropping ? (dimensions.height * currentScale) : (dimensions.height * currentScale * (cropArea.height / 100))) : 'auto',
                    // Removed rotation from here to let Parent handle it
                    transformOrigin: 'center center',
                    transition: 'none'
                }}
            >
                {/* Inner Clipper for Image */}
                <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                        overflow: isCropping ? 'visible' : 'hidden',
                        pointerEvents: 'none' // Let clicks pass through if needed, though we block drags below
                    }}
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

                    {/* Image with transformations applied directly */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={imageRef}
                        src={image.image.url}
                        alt={image.image.name}
                        onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            setDimensions({
                                width: target.offsetWidth, // Original rendered width (max-w applied)
                                height: target.offsetHeight
                            });
                        }}
                        className="max-w-[300px] object-contain rounded-md shadow-lg pointer-events-none"
                        style={{
                            position: isCropping ? 'static' : 'absolute',
                            width: isCropping ? '100%' : (dimensions.width ? (dimensions.width * currentScale) : 'auto'),
                            height: isCropping ? '100%' : (dimensions.height ? (dimensions.height * currentScale) : 'auto'),
                            maxWidth: 'none',
                            maxHeight: 'none',
                            left: isCropping ? 0 : -(dimensions.width * currentScale * (cropArea.x / 100)),
                            top: isCropping ? 0 : -(dimensions.height * currentScale * (cropArea.y / 100)),
                            transform: `
                            scaleX(${image.flipH ? -1 : 1})
                            scaleY(${image.flipV ? -1 : 1})
                        `,
                            filter,
                            transition: 'transform 0.2s ease-out, filter 0.2s ease-out'
                        }}
                    />
                </div>

                {/* Buttons - Moved outside of inner clipper to be visible */}
                <div
                    className="absolute z-[9999] transition-opacity duration-200 flex gap-1"
                    style={{
                        top: '-8px',
                        right: '-8px',
                        transform: 'translate(50%, -50%)',
                        transformOrigin: 'bottom left',
                        opacity: showButtons ? 1 : 0,
                        pointerEvents: showButtons ? 'auto' : 'none'
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
                    <>
                        <div
                            className="absolute bg-blue-500 text-white text-xs px-2 py-0.5 rounded-t font-medium whitespace-nowrap prevent-item-drag"
                            style={{
                                top: '-24px',
                                left: '0px',
                                transformOrigin: 'bottom left'
                            }}
                        >
                            ✏️ Editando
                        </div>
                        {/* Resize Handles */}
                        {['nw', 'ne', 'sw', 'se'].map((corner) => (
                            <div
                                key={`resize-${corner}`}
                                className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md prevent-item-drag z-[10000]"
                                style={{
                                    [corner.includes('n') ? 'top' : 'bottom']: '-8px',
                                    [corner.includes('w') ? 'left' : 'right']: '-8px',
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
                                    
                                    const baseWidth = dimensions.width * (cropArea.width / 100);
                                    const baseHeight = dimensions.height * (cropArea.height / 100);
                                    if (!baseWidth || !baseHeight) return;

                                    const startScale = image.scale || 1;
                                    const startWidth = baseWidth * startScale;
                                    const startHeight = baseHeight * startScale;
                                    const startPos = { ...image.position };

                                    const isWest = corner.includes('w');
                                    const isNorth = corner.includes('n');

                                    const fixedX = isWest ? startPos.x + startWidth : startPos.x;
                                    const fixedY = isNorth ? startPos.y + startHeight : startPos.y;

                                    const handlePointerMove = (moveE: PointerEvent) => {
                                        moveE.stopPropagation();
                                        
                                        const worldDeltaX = (moveE.clientX - startX) / transform.k;
                                        const worldDeltaY = (moveE.clientY - startY) / transform.k;

                                        const widthChange = isWest ? -worldDeltaX : worldDeltaX;
                                        const heightChange = isNorth ? -worldDeltaY : worldDeltaY;

                                        const deltaScaleX = widthChange / baseWidth;
                                        const deltaScaleY = heightChange / baseHeight;
                                        const deltaScale = (deltaScaleX + deltaScaleY) / 2;

                                        const newScale = Math.max(0.1, Math.min(10, startScale + deltaScale));

                                        const actualNewWidth = baseWidth * newScale;
                                        const actualNewHeight = baseHeight * newScale;

                                        const newX = isWest ? fixedX - actualNewWidth : startPos.x;
                                        const newY = isNorth ? fixedY - actualNewHeight : startPos.y;

                                        onUpdate({
                                            ...image,
                                            scale: newScale,
                                            position: { x: newX, y: newY }
                                        });
                                    };

                                    const handlePointerUp = (upE: PointerEvent) => {
                                        upE.stopPropagation();
                                        target.releasePointerCapture(upE.pointerId);
                                        target.removeEventListener('pointermove', handlePointerMove);
                                        target.removeEventListener('pointerup', handlePointerUp);
                                    };

                                    target.addEventListener('pointermove', handlePointerMove);
                                    target.addEventListener('pointerup', handlePointerUp);
                                }}
                            />
                        ))}
                    </>
                )}


            </div>


            {CropOverlay}
        </>
    );
};

export default ImageItem;
