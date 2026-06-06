# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-wall.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_func = '''export function EditableWall({
    wall,
    onUpdate,
    isSelected = false,
    onSelect,
    onRightClick,
    onDrag,
    onDragStart,
    isRenaming = false,
    onRenameEnd,
    zIndex = 1,
}: EditableWallProps) {'''

replacement_func = '''export function EditableWall({
    wall,
    onUpdate,
    isSelected = false,
    onSelect,
    onRightClick,
    onDrag,
    onDragStart,
    isRenaming = false,
    onRenameEnd,
    zIndex = 1,
    isDrawingMode = false,
}: EditableWallProps) {'''

if target_func in content:
    content = content.replace(target_func, replacement_func)
    with open('src/components/Canva/itens/editable-wall.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed EditableWall parameters.")
else:
    print("Not found.")
