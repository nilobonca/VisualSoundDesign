# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-wall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_props = '''    setDraggedPointIndex: (index: number | null) => void;
    setIsDraggingPoint: (isDragging: boolean) => void;
    onUpdate: (wall: ActiveWall) => void;
}'''

replacement_props = '''    setDraggedPointIndex: (index: number | null) => void;
    setIsDraggingPoint: (isDragging: boolean) => void;
    onUpdate: (wall: ActiveWall) => void;
    isDrawingMode?: boolean;
}'''

target_func = '''function EditableWallPoint({ point, index, wall, isPointDragged, setDraggedPointIndex, setIsDraggingPoint, onUpdate }: EditableWallPointProps) {'''
replacement_func = '''function EditableWallPoint({ point, index, wall, isPointDragged, setDraggedPointIndex, setIsDraggingPoint, onUpdate, isDrawingMode }: EditableWallPointProps) {'''

target_handle = '''            onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();'''

replacement_handle = '''            onContextMenu={(e) => {
                if (isDrawingMode) return;
                e.stopPropagation();
                e.preventDefault();'''

target_render = '''                setDraggedPointIndex={setDraggedPointIndex}
                setIsDraggingPoint={setIsDraggingPoint}
                onUpdate={onUpdate}
            />'''

replacement_render = '''                setDraggedPointIndex={setDraggedPointIndex}
                setIsDraggingPoint={setIsDraggingPoint}
                onUpdate={onUpdate}
                isDrawingMode={isDrawingMode}
            />'''

if target_props in content:
    content = content.replace(target_props, replacement_props)
if target_func in content:
    content = content.replace(target_func, replacement_func)
if target_handle in content:
    content = content.replace(target_handle, replacement_handle)
if target_render in content:
    content = content.replace(target_render, replacement_render)

with open('src/components/Canva/itens/editable-wall.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed EditableWallPoint.")
