# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-wall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_component = '''
interface EditableWallPointProps {
    point: { x: number, y: number };
    index: number;
    wall: ActiveWall;
    isPointDragged: boolean;
    setDraggedPointIndex: (index: number | null) => void;
    setIsDraggingPoint: (isDragging: boolean) => void;
    onUpdate: (wall: ActiveWall) => void;
}

function EditableWallPoint({ point, index, wall, isPointDragged, setDraggedPointIndex, setIsDraggingPoint, onUpdate }: EditableWallPointProps) {
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
            onClick={(e) => {
                e.stopPropagation();
            }}
            onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (wall.points.length > 2) {
                    const newPoints = wall.points.filter((_, i) => i !== index);
                    onUpdate({ ...wall, points: newPoints });
                }
            }}
            onPointerEnter={() => {
                document.body.style.cursor = 'move';
            }}
            onPointerLeave={() => {
                document.body.style.cursor = 'default';
            }}
        />
    );
}

export function EditableWall({
'''

if 'interface EditableWallPointProps' not in content:
    content = content.replace("export function EditableWall({\n", new_component)
    with open('src/components/Canva/itens/editable-wall.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Already fixed.")
