import React, { useState, useRef, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Minus, Plus, RotateCcw, Grip } from 'lucide-react';

/**
 * Configurações do Canvas
 */
// Retiramos a exportação da constante fixa, agora é dinâmico
const MIN_CANVAS_SIZE = 3000; // Tamanho mínimo
const MINIMAP_SIZE = 180;
const MAX_SCALE = 4;

// Contexto para compartilhar o estado do Canvas (Zoom/Pan) com os filhos
interface CanvasContextType {
  transform: { x: number; y: number; k: number };
}
export const CanvasContext = createContext<CanvasContextType>({ transform: { x: 0, y: 0, k: 1 } });
export const useCanvas = () => useContext(CanvasContext);

interface CanvasContainerProps {
  children: ReactNode;
  items?: Array<{ id: string; type?: string; position?: { x: number; y: number }; points?: Array<{ x: number; y: number }>; width?: number; height?: number; color?: string }>;
  onDropItem?: (item: { id: string | number }, type: string, x: number, y: number) => void;
  onDropFile?: (files: FileList, x: number, y: number) => void;
  onCanvasRightClick?: (e: React.MouseEvent, worldX: number, worldY: number) => void;
  onSelectionChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  onCanvasClick?: (e: React.MouseEvent, worldX: number, worldY: number) => void;
}

const CanvasContainer = React.forwardRef<{ centerOn: (x: number, y: number) => void }, CanvasContainerProps>(
  ({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick }, ref) => {
  // Estado do Viewport (Posição X, Y e Zoom)
  const [transform, setTransform] = useState({ x: -500, y: -500, k: 1 });

  // Estados de Dragging
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Refs para manipulação direta e cálculos
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const minimapDragStart = useRef({ x: 0, y: 0 });

  // Helper: Clamping (Limitar valor entre min e max)
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // --- Dynamic Size Calculation (Monotonic Session Growth) ---
  const [dynamicCanvasSize, setDynamicCanvasSize] = useState(MIN_CANVAS_SIZE);

  useEffect(() => {
    const calculateRequiredSize = () => {
      let maxX = 0;
      let maxY = 0;

      items.forEach(item => {
        if (item.position) {
          maxX = Math.max(maxX, item.position.x + (item.width || 100)); // Add basic buffer/width
          maxY = Math.max(maxY, item.position.y + (item.height || 100));
        } else if (item.points) {
          item.points.forEach(p => {
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        }
      });

      const maxDim = Math.max(maxX, maxY);
      const rawSize = Math.max(MIN_CANVAS_SIZE, maxDim + 1000);

      // Round up to nearest 100
      return Math.ceil(rawSize / 100) * 100;
    };

    const neededSize = calculateRequiredSize();

    // Only update if the needed size is LARGER than current session max
    setDynamicCanvasSize(prev => Math.max(prev, neededSize));

  }, [items]);

  /**
   * Função Mágica Atualizada: Restrição de Bordas E Zoom
   */
  const constrainBounds = useCallback((targetX: number, targetY: number, targetK: number) => {
    if (!containerRef.current) return { x: targetX, y: targetY, k: targetK };

    // We need to fetch current dynamic size inside callback or pass it?
    // Since enable dependency on items for recalculation might be heavy, 
    // let's assume we can use the latest dynamicCanvasSize in render cycle if available via ref or closure if deps updated.
    // Adding dynamicCanvasSize to deps.
    const currentSize = dynamicCanvasSize;

    const { width: viewW, height: viewH } = containerRef.current.getBoundingClientRect();

    const minScaleW = viewW / currentSize;
    const minScaleH = viewH / currentSize;
    const dynamicMinScale = Math.max(minScaleW, minScaleH);

    const constrainedK = Math.max(dynamicMinScale, Math.min(targetK, MAX_SCALE));

    const contentSize = currentSize * constrainedK;

    let fixedX = targetX;
    let fixedY = targetY;

    // Calculate slack (space remaining)
    const diffW = viewW - contentSize;
    const diffH = viewH - contentSize;

    // X Axis Clamping - Bias Top/Left (Stable Origin)
    if (diffW < 0) {
      // Content larger than view: standard pan clamping
      fixedX = clamp(targetX, diffW, 0);
    } else {
      // Content smaller than view: allow panning within slack, but don't force center
      // Range: [0 ... diffW] (or [0 ... 0] if we want strict TL lock)
      // Allowing [0, diffW] lets user pan slightly if they want, but default is stable.
      fixedX = clamp(targetX, 0, diffW);
    }

    // Y Axis Clamping
    if (diffH < 0) {
      fixedY = clamp(targetY, diffH, 0);
    } else {
      fixedY = clamp(targetY, 0, diffH);
    }

    return { x: fixedX, y: fixedY, k: constrainedK };
  }, [dynamicCanvasSize]);

  React.useImperativeHandle(ref, () => ({
    centerOn(worldX: number, worldY: number) {
      if (!containerRef.current) return;
      const { width: viewW, height: viewH } = containerRef.current.getBoundingClientRect();
      const targetX = viewW / 2 - worldX * transform.k;
      const targetY = viewH / 2 - worldY * transform.k;
      setTransform(constrainBounds(targetX, targetY, transform.k));
    }
  }));

  // Handle Context Menu (Right Click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCanvasRightClick && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - transform.x) / transform.k;
      const worldY = (mouseY - transform.y) / transform.k;
      onCanvasRightClick(e, worldX, worldY);
    }
  };

  /**
   * 1. Lógica de PANNING DO CANVAS (Arrastar o fundo)
   */
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    // Only allow panning if Space is pressed
    if (!isSpacePressed) return;

    setIsDraggingCanvas(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  /**
   * 1.5 Selection Logic
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on an item (no-drag class) or space is pressed, don't start selection
    if ((e.target as HTMLElement).closest('.no-drag') || isSpacePressed || (e.button !== 0)) {
      handleCanvasMouseDown(e);
      return;
    }

    // Start selection box
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
    }
  };

  /**
   * 2. Lógica de ZOOM (Roda do Mouse)
   */
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.minimap-container')) return;

    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;

    const newScaleCandidate = Math.max(0.1, transform.k + delta);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - transform.x) / transform.k;
      const worldY = (mouseY - transform.y) / transform.k;

      const rawX = mouseX - worldX * newScaleCandidate;
      const rawY = mouseY - worldY * newScaleCandidate;

      setTransform(constrainBounds(rawX, rawY, newScaleCandidate));
    }
  };

  /**
   * 3. Lógica do MINIMAP INTERATIVO
   */
  const minimapRatio = MINIMAP_SIZE / dynamicCanvasSize;

  const handleMinimapMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMinimap(true);
    minimapDragStart.current = { x: e.clientX, y: e.clientY };
  };

  /**
   * 4. Drop Logic
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const containerX = clientX - rect.left;
      const containerY = clientY - rect.top;

      // WorldX = (ContainerX - TranslateX) / Scale
      const worldX = (containerX - transform.x) / transform.k;
      const worldY = (containerY - transform.y) / transform.k;

      // Handle File Drop from OS
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (onDropFile) {
          onDropFile(e.dataTransfer.files, worldX, worldY);
        }
        return;
      }

      // Handle Internal Item Drop
      if (!onDropItem) return;

      const itemId = e.dataTransfer.getData('itemId');
      const itemType = e.dataTransfer.getData('itemType');

      onDropItem({ id: itemId }, itemType, worldX, worldY);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Efeito global de movimento
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDraggingCanvas) {
        e.preventDefault();
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        dragStart.current = { x: e.clientX, y: e.clientY };

        setTransform((prev) => {
          const rawX = prev.x + dx;
          const rawY = prev.y + dy;
          return constrainBounds(rawX, rawY, prev.k);
        });
      }

      if (isDraggingMinimap) {
        e.preventDefault();
        const dx = e.clientX - minimapDragStart.current.x;
        const dy = e.clientY - minimapDragStart.current.y;
        minimapDragStart.current = { x: e.clientX, y: e.clientY };

        setTransform((prev) => {
          const rawX = prev.x - (dx / minimapRatio) * prev.k;
          const rawY = prev.y - (dy / minimapRatio) * prev.k;
          return constrainBounds(rawX, rawY, prev.k);
        });
      }

      if (selectionBox && containerRef.current) {
        setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX - containerRef.current!.getBoundingClientRect().left, currentY: e.clientY - containerRef.current!.getBoundingClientRect().top } : null);
      }
    };

    const handleWindowMouseUp = () => {
      if (selectionBox && onSelectionChange) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const left = Math.min(selectionBox.startX, selectionBox.currentX);
          const top = Math.min(selectionBox.startY, selectionBox.currentY);
          const width = Math.abs(selectionBox.currentX - selectionBox.startX);
          const height = Math.abs(selectionBox.currentY - selectionBox.startY);

          if (width > 5 && height > 5) {
            onSelectionChange({ x: left, y: top, width, height });
          } else {
            onSelectionChange(null); // Clicked without dragging much -> Deselect
          }
        }
      }

      setIsDraggingCanvas(false);
      setIsDraggingMinimap(false);
      setSelectionBox(null);
      document.body.style.cursor = 'default';
    };

    const handleResize = () => {
      setTransform(prev => constrainBounds(prev.x, prev.y, prev.k));
    };

    if (isDraggingCanvas || isDraggingMinimap || selectionBox) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDraggingCanvas, isDraggingMinimap, minimapRatio, constrainBounds, selectionBox, onSelectionChange]);

  // Space Key Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helpers UI
  const zoomCenter = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newScale = transform.k * factor;
    const worldX = (centerX - transform.x) / transform.k;
    const worldY = (centerY - transform.y) / transform.k;

    const rawX = centerX - worldX * newScale;
    const rawY = centerY - worldY * newScale;

    setTransform(constrainBounds(rawX, rawY, newScale));
  };

  // Minimap Rect Calculation
  const getViewRect = () => {
    if (!containerRef.current) return { x: 0, y: 0, w: 0, h: 0 };
    const { width, height } = containerRef.current.getBoundingClientRect();

    return {
      x: (-transform.x / transform.k) * minimapRatio,
      y: (-transform.y / transform.k) * minimapRatio,
      w: (width / transform.k) * minimapRatio,
      h: (height / transform.k) * minimapRatio
    };
  };
  const viewRect = getViewRect();

  // Inicialização
  useEffect(() => {
    setTransform(prev => constrainBounds(prev.x, prev.y, prev.k));
  }, [constrainBounds]);

  return (
    <CanvasContext.Provider value={{ transform }}>
      <div className="flex flex-col h-full w-full bg-neutral-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">

        {/* Área Principal */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-neutral-900"
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ cursor: isSpacePressed ? (isDraggingCanvas ? 'grabbing' : 'grab') : 'default' }}
        >

          {/* --- MUNDO (Conteúdo com Transform) --- */}
          <div
            className="origin-top-left will-change-transform"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              width: dynamicCanvasSize,
              height: dynamicCanvasSize,
            }}
          >
            {/* Grid Infinito - Adaptive Density */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                // Calculate size so it stays roughly constant in screen space
                // 40 / k means: 40px screen distance / scale factor = world distance
                backgroundImage: `radial-gradient(#404040 ${1 / transform.k}px, transparent ${1 / transform.k}px)`,
                backgroundSize: `${40 / transform.k}px ${40 / transform.k}px`,
                opacity: 0.5
              }}
            />

            {/* Limites do Mundo */}
            <div className="absolute inset-0 border-2 border-blue-500/50 shadow-[inset_0_0_40px_rgba(59,130,246,0.2)] pointer-events-none">
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono border border-blue-500/30">0,0</div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono border border-blue-500/30">{dynamicCanvasSize},{dynamicCanvasSize}</div>
            </div>

            {/* --- SEUS ELEMENTOS AQUI --- */}
            {children}

            {/* Removed Indicator Elements (Corners and Center) */}

          </div>

          {/* Minimap - Hidden on mobile */}
          <div
            className="minimap-container hidden md:block absolute bottom-16 right-6 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg overflow-hidden z-50 select-none no-drag group"
            style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
          >
            <div className="relative w-full h-full bg-neutral-800/50">

              <div className="absolute bg-blue-500/30 rounded-full" style={{ top: '50%', left: '50%', width: 4, height: 4, transform: 'translate(-50%, -50%)' }} />

              {/* Itens do Minimapa */}
              {items.map((item) => {
                // Determine item properties based on type
                let color = 'bg-green-500'; // Default (Player/Image)
                let opacity = 0.8;
                let finalWidth = 200 * minimapRatio;
                let finalHeight = 100 * minimapRatio;

                if (item.type === 'note') {
                  color = 'bg-yellow-400';
                  opacity = 0.9;
                  if (item.width && item.height) {
                    finalWidth = item.width * minimapRatio;
                    finalHeight = item.height * minimapRatio;
                  }
                } else if (item.type === 'soundboard') {
                  color = 'bg-purple-500'; // Soundboard Item
                  finalWidth = 64 * minimapRatio; // Assuming standard button size
                  finalHeight = 64 * minimapRatio;
                } else if (item.type === 'pin') {
                  color = 'bg-red-500';
                  finalWidth = 40 * minimapRatio;
                  finalHeight = 40 * minimapRatio;
                }

                // Handle items with position (players, images, notes, soundboard, pins)
                if (item.position) {
                  return (
                    <div
                      key={item.id}
                      className={`absolute ${color} rounded-sm`}
                      style={{
                        left: item.position.x * minimapRatio,
                        top: item.position.y * minimapRatio,
                        width: finalWidth,
                        height: finalHeight,
                        opacity: opacity
                      }}
                    />
                  );
                }
                // Handle items with points (areas)
                if (item.points && item.points.length > 0) {
                  const minX = Math.min(...item.points.map((p: { x: number; y: number }) => p.x));
                  const minY = Math.min(...item.points.map((p: { x: number; y: number }) => p.y));
                  const maxX = Math.max(...item.points.map((p: { x: number; y: number }) => p.x));
                  const maxY = Math.max(...item.points.map((p: { x: number; y: number }) => p.y));
                  return (
                    <div
                      key={item.id}
                      className="absolute bg-blue-500 rounded-sm"
                      style={{
                        left: minX * minimapRatio,
                        top: minY * minimapRatio,
                        width: (maxX - minX) * minimapRatio,
                        height: (maxY - minY) * minimapRatio,
                        opacity: 0.6
                      }}
                    />
                  );
                }
                return null;
              })}

              <div
                className={`absolute border-2 border-blue-500 bg-blue-500/10 transition-colors ${isDraggingMinimap ? 'cursor-grabbing bg-blue-500/20' : 'cursor-grab hover:bg-blue-500/20'}`}
                onMouseDown={handleMinimapMouseDown}
                style={{
                  left: viewRect.x,
                  top: viewRect.y,
                  width: viewRect.w,
                  height: viewRect.h,
                  maxWidth: MINIMAP_SIZE,
                  maxHeight: MINIMAP_SIZE,
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Grip size={12} />
                </div>
              </div>
            </div>



          </div>
          {/* Size Indicator */}
          {/* Canvas Controls Container */}
          <div className="absolute select-none no-drag group z-[60] bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 flex flex-col items-end gap-2">

            {/* Size Indicator */}
            <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700/50 shadow-lg text-xs text-neutral-400 font-mono select-none backdrop-blur-sm">
              <span className="text-neutral-500 font-bold">TAMANHO</span>
              <span className="text-neutral-200">{dynamicCanvasSize} <span className="text-neutral-600">x</span> {dynamicCanvasSize}</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between gap-0.5 bg-neutral-800 p-1 rounded-lg border border-neutral-700/50 shadow-lg w-[180px]">
              <button onClick={() => zoomCenter(0.8)} className="p-1 hover:bg-neutral-700 active:bg-neutral-600 rounded transition text-neutral-300 hover:text-white touch-manipulation flex-shrink-0" aria-label="Zoom Out">
                <Minus size={16} />
              </button>
              <div className="flex items-center justify-center gap-0.5 flex-1 min-w-0">
                <input
                  type="number"
                  value={Math.round(transform.k * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      const newK = Math.max(0.1, Math.min(5, val / 100)); // Clamp between 10% and 500%
                      setTransform(prev => ({ ...prev, k: newK }));
                    }
                  }}
                  className="text-xs font-mono w-8 text-center text-neutral-400 bg-transparent border-none outline-none focus:text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none -moz-appearance-textfield p-0"
                />
                <span className="text-neutral-600 select-none text-xs">%</span>
              </div>
              <button onClick={() => zoomCenter(1.2)} className="p-1 hover:bg-neutral-700 active:bg-neutral-600 rounded transition text-neutral-300 hover:text-white touch-manipulation flex-shrink-0" aria-label="Zoom In">
                <Plus size={16} />
              </button>
              <div className="w-px h-3 bg-neutral-700 mx-0.5"></div>
              <button onClick={() => {
                const rect = containerRef.current?.getBoundingClientRect();
                // Reset para o zoom minimo possivel (Fit Screen)
                const minW = rect ? rect.width / dynamicCanvasSize : 1;
                setTransform(constrainBounds(0, 0, minW));
              }} className="p-1 hover:bg-neutral-700 active:bg-neutral-600 rounded transition text-neutral-300 hover:text-white touch-manipulation flex-shrink-0" title="Fit Screen" aria-label="Reset Zoom">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Space Panning Overlay */}
          {isSpacePressed && (
            <div
              className="absolute inset-0 z-[100] cursor-grab active:cursor-grabbing"
              onMouseDown={handleCanvasMouseDown}
            />
          )}

          {/* Selection Box */}
          {selectionBox && (
            <div
              className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-[100]"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY),
              }}
            />
          )}
        </div>
      </div>
    </CanvasContext.Provider>
  );
});

CanvasContainer.displayName = 'CanvasContainer';
export default CanvasContainer;