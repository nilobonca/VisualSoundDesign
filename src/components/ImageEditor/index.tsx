import React, { useState } from 'react';
import { X, RotateCw, Maximize2, FlipHorizontal, FlipVertical, RefreshCw, Check, Crop } from 'lucide-react';
import { ActiveImage } from '@/interfaces/utils/indexedDB';

import { useViewportResize } from '@/hooks/useViewportResize';

interface ImageEditorProps {
    image: ActiveImage;
    onUpdate: (image: ActiveImage) => void;
    onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ image, onUpdate, onClose }) => {
    const { size, setSize, isDesktop } = useViewportResize({
        initialSize: { width: 320, height: 600 },
        initialPosition: { x: 0, y: 0 },
        minWidth: 280,
        minHeight: 300
    });

    // ... existing state ...
    const [rotation, setRotation] = useState(image.rotation || 0);
    const [scale, setScale] = useState(image.scale || 1);
    const [flipH, setFlipH] = useState(image.flipH || false);
    const [flipV, setFlipV] = useState(image.flipV || false);
    const [brightness, setBrightness] = useState(image.brightness || 0);
    const [contrast, setContrast] = useState(image.contrast || 0);
    const [opacity, setOpacity] = useState(image.opacity || 100);

    // Crop states
    const [hasCrop, setHasCrop] = useState(!!image.crop);
    const [cropX, setCropX] = useState(image.crop?.x || 0);
    const [cropY, setCropY] = useState(image.crop?.y || 0);
    const [cropWidth, setCropWidth] = useState(image.crop?.width || 100);
    const [cropHeight, setCropHeight] = useState(image.crop?.height || 100);

    // Update in real-time as user changes values
    const handleChange = (updates: Partial<ActiveImage>) => {
        onUpdate({
            ...image,
            rotation,
            scale,
            flipH,
            flipV,
            brightness,
            contrast,
            opacity,
            crop: hasCrop ? { x: cropX, y: cropY, width: cropWidth, height: cropHeight } : undefined,
            ...updates
        });
    };

    const handleReset = () => {
        setRotation(0);
        setScale(1);
        setFlipH(false);
        setFlipV(false);
        setBrightness(0);
        setContrast(0);
        setOpacity(100);
        setHasCrop(false);
        setCropX(0);
        setCropY(0);
        setCropWidth(100);
        setCropHeight(100);
        handleChange({
            rotation: 0,
            scale: 1,
            flipH: false,
            flipV: false,
            brightness: 0,
            contrast: 0,
            opacity: 100,
            crop: undefined
        });
    };

    return (
        <div
            className="fixed right-4 top-20 bg-white rounded-lg shadow-2xl p-4 overflow-y-auto z-50 border-2 border-blue-500"
            style={{
                width: isDesktop ? size.width : '100%',
                maxHeight: 'calc(100vh - 100px)',
                maxWidth: 'calc(100vw - 20px)'
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h3 className="font-bold text-lg">Editar Imagem</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1">
                    <X size={20} />
                </button>
            </div>

            {/* Image Name */}
            <div className="mb-4 p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 truncate" title={image.image.name}>
                    📷 {image.image.name}
                </p>
            </div>

            {/* Controls */}
            <div className="space-y-5">
                {/* Transform Controls */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2 pb-2 border-b">
                        <RotateCw size={14} />
                        Transformações
                    </h4>

                    {/* Rotation */}
                    <div>
                        <label className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Rotação</span>
                            <span className="text-gray-500 font-mono">{rotation}°</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={rotation}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setRotation(val);
                                handleChange({ rotation: val });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Scale */}
                    <div>
                        <label className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Escala</span>
                            <span className="text-gray-500 font-mono">{scale.toFixed(2)}x</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setScale(val);
                                handleChange({ scale: val });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Flip Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setFlipH(!flipH);
                                handleChange({ flipH: !flipH });
                            }}
                            className={`flex-1 py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1.5 font-medium transition-colors ${flipH ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <FlipHorizontal size={14} />
                            Flip H
                        </button>
                        <button
                            onClick={() => {
                                setFlipV(!flipV);
                                handleChange({ flipV: !flipV });
                            }}
                            className={`flex-1 py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1.5 font-medium transition-colors ${flipV ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <FlipVertical size={14} />
                            Flip V
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="space-y-3 pt-3 border-t">
                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2 pb-2 border-b">
                        <Maximize2 size={14} />
                        Filtros
                    </h4>

                    {/* Brightness */}
                    <div>
                        <label className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Brilho</span>
                            <span className="text-gray-500 font-mono">{brightness > 0 ? '+' : ''}{brightness}</span>
                        </label>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={brightness}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setBrightness(val);
                                handleChange({ brightness: val });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Contrast */}
                    <div>
                        <label className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Contraste</span>
                            <span className="text-gray-500 font-mono">{contrast > 0 ? '+' : ''}{contrast}</span>
                        </label>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={contrast}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setContrast(val);
                                handleChange({ contrast: val });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Opacity */}
                    <div>
                        <label className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium">Opacidade</span>
                            <span className="text-gray-500 font-mono">{opacity}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={opacity}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setOpacity(val);
                                handleChange({ opacity: val });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-5 pt-4 border-t">
                <button
                    onClick={handleReset}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                    <RefreshCw size={14} />
                    Resetar
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                    <Check size={14} />
                    Concluir
                </button>
            </div>
        </div>
    );
};

export default ImageEditor;
