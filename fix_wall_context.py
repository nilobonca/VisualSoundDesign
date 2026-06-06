# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-wall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_props = '''interface EditableWallProps {
    wall: ActiveWall;
    onUpdate: (wall: ActiveWall) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;'''

replacement_props = '''interface EditableWallProps {
    wall: ActiveWall;
    onUpdate: (wall: ActiveWall) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;
    isDrawingMode?: boolean;'''

target_func = '''export function EditableWall({
    wall,
    onUpdate,
    isSelected,
    onSelect,
    onRightClick,
    isActive,
    onDrag,
    onDragStart
}: EditableWallProps) {'''

replacement_func = '''export function EditableWall({
    wall,
    onUpdate,
    isSelected,
    onSelect,
    onRightClick,
    isActive,
    onDrag,
    onDragStart,
    isDrawingMode
}: EditableWallProps) {'''

target_handle = '''            onContextMenu={e => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;'''

replacement_handle = '''            onContextMenu={e => {
                if (isDrawingMode) return;
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;'''

if target_props in content:
    content = content.replace(target_props, replacement_props)
if target_func in content:
    content = content.replace(target_func, replacement_func)
if target_handle in content:
    content = content.replace(target_handle, replacement_handle)

with open('src/components/Canva/itens/editable-wall.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed EditableWall.")
