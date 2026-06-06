# -*- coding: utf-8 -*-
import sys

with open('src/components/Canva/canva-teste.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_props = "  onCanvasMouseMove?: (e: React.MouseEvent, worldX: number, worldY: number) => void;"
replacement_props = "  onCanvasMouseMove?: (e: React.MouseEvent, worldX: number, worldY: number) => void;\n  isSelectionEnabled?: boolean;"

target_destruct = "  ({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick, onCanvasMouseMove }, ref) => {"
replacement_destruct = "  ({ children, items = [], onDropItem, onDropFile, onCanvasRightClick, onSelectionChange, onCanvasClick, onCanvasMouseMove, isSelectionEnabled = true }, ref) => {"

target_mousedown = "    // Start selection box"
replacement_mousedown = "    // Start selection box\n    if (!isSelectionEnabled) return;"

if target_props in content and target_destruct in content and target_mousedown in content:
    content = content.replace(target_props, replacement_props)
    content = content.replace(target_destruct, replacement_destruct)
    content = content.replace(target_mousedown, replacement_mousedown)
    with open('src/components/Canva/canva-teste.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed selection box.")
else:
    print("Targets not found.")
