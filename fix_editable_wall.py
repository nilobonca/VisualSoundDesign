# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-wall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_component = '''
interface EditableWallPointProps {
    point: { x: number, y: number };
    index: number;
    wallPoints: { x: number, y: number }[];
    isPointDragged: boolean;
    setDraggedPointIndex: (index: number | null) => void;
    setIsDraggingPoint: (isDragging: boolean) => void;
    onUpdatePoints: (newPoints: { x: number, y: number }[]) => void;
}

function EditableWallPoint({ point, index, wallPoints, isPointDragged, setDraggedPointIndex, setIsDraggingPoint, onUpdatePoints }: EditableWallPointProps) {
    const bindPointGesture = useGesture({
        onDragStart: (state) => {
            state.event.stopPropagation();
            setDraggedPointIndex(index);
            setIsDraggingPoint(true);
        },
        onDrag: (state) => {
            state.event.stopPropagation();
            const { delta: [dx, dy] } = state;

            const newPoints = [...wallPoints];
            newPoints[index] = {
                x: newPoints[index].x + dx,
                y: newPoints[index].y + dy
            };

            onUpdatePoints(newPoints);
        },
        onDragEnd: () => {
            setDraggedPointIndex(null);
            setIsDraggingPoint(false);
        }
    });

    return (
        <div
            className={cn(
                "absolute w-4 h-4 -ml-2 -mt-2 bg-white border-2 border-red-500 cursor-move rounded-full hover:bg-red-50 hover:scale-125 transition-transform touch-none shadow-sm",
                isPointDragged ? "bg-red-100 scale-125 ring-2 ring-red-400" : ""
            )}
            style={{
                left: point.x,
                top: point.y,
                zIndex: 30,
                pointerEvents: 'auto'
            }}
            {...bindPointGesture()}
            onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                // Remove point logic
                if (wallPoints.length > 2) {
                    const newPoints = [...wallPoints];
                    newPoints.splice(index, 1);
                    onUpdatePoints(newPoints);
                }
            }}
        />
    );
}

export function EditableWall({
'''

content = content.replace("export function EditableWall({\n", new_component)

target_render_points = '''    const renderPoints = () => {
        if (!isSelected) return null;

        return wall.points.map((point, index) => {
            const bindPointGesture = useGesture({
                onDragStart: (state) => {
                    state.event.stopPropagation();
                    setDraggedPointIndex(index);
                    setIsDraggingPoint(true);
                },
                onDrag: (state) => {
                    state.event.stopPropagation();
                    const { delta: [dx, dy] } = state;

                    const newPoints = [...wall.points];
                    newPoints[index] = {
                        x: newPoints[index].x + dx,
                        y: newPoints[index].y + dy
                    };

                    onUpdate({ ...wall, points: newPoints });
                },
                onDragEnd: () => {
                    setDraggedPointIndex(null);
                    setIsDraggingPoint(false);
                }
            });

            const isPointDragged = draggedPointIndex === index;

            return (
                <div
                    key={point-}
                    className={cn(
                        "absolute w-4 h-4 -ml-2 -mt-2 bg-white border-2 border-red-500 cursor-move rounded-full hover:bg-red-50 hover:scale-125 transition-transform touch-none shadow-sm",
                        isPointDragged ? "bg-red-100 scale-125 ring-2 ring-red-400" : ""
                    )}
                    style={{
                        left: point.x,
                        top: point.y,
                        zIndex: 30,
                        pointerEvents: 'auto'
                    }}
                    {...bindPointGesture()}
                    onContextMenu={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Remove point
                        if (wall.points.length > 2) {
                            const newPoints = [...wall.points];
                            newPoints.splice(index, 1);
                            onUpdate({ ...wall, points: newPoints });
                        }
                    }}
                />
            );
        });
    };'''

replacement_render_points = '''    const renderPoints = () => {
        if (!isSelected) return null;

        return wall.points.map((point, index) => (
            <EditableWallPoint
                key={point-}
                point={point}
                index={index}
                wallPoints={wall.points}
                isPointDragged={draggedPointIndex === index}
                setDraggedPointIndex={setDraggedPointIndex}
                setIsDraggingPoint={setIsDraggingPoint}
                onUpdatePoints={(newPoints) => onUpdate({ ...wall, points: newPoints })}
            />
        ));
    };'''

if target_render_points in content:
    content = content.replace(target_render_points, replacement_render_points)
    with open('src/components/Canva/itens/editable-wall.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed EditableWall hooks issue.")
else:
    print("Target not found.")
