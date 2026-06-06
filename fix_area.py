# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/itens/editable-area.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_props = '''interface EditableAreaProps {
    area: ActiveArea;
    onUpdate: (area: ActiveArea) => void;

    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;'''

replacement_props = '''interface EditableAreaProps {
    area: ActiveArea;
    onUpdate: (area: ActiveArea) => void;

    isSelected?: boolean;
    onSelect?: () => void;
    onRightClick?: (e: React.MouseEvent) => void;
    isDrawingMode?: boolean;'''

target_func = '''export default function EditableArea({ area, onUpdate, isSelected, onSelect, onRightClick, isActive, onHover, onDrag, onDragStart, isRenaming, onRenameEnd, zIndex, savedAudios = [] }: EditableAreaProps) {'''
replacement_func = '''export default function EditableArea({ area, onUpdate, isSelected, onSelect, onRightClick, isDrawingMode, isActive, onHover, onDrag, onDragStart, isRenaming, onRenameEnd, zIndex, savedAudios = [] }: EditableAreaProps) {'''

target_handle = '''    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clickP = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };'''

replacement_handle = '''    const handleContextMenu = (e: React.MouseEvent) => {
        if (isDrawingMode) return;
        e.preventDefault();
        e.stopPropagation();

        const clickP = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };'''

if target_props in content:
    content = content.replace(target_props, replacement_props)
if target_func in content:
    content = content.replace(target_func, replacement_func)
if target_handle in content:
    content = content.replace(target_handle, replacement_handle)

with open('src/components/Canva/itens/editable-area.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed EditableArea.")
