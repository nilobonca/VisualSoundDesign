# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_wall = '''                  <EditableWall
                    key={wall.id}
                    wall={wall}
                    zIndex={index}'''

replacement_wall = '''                  <EditableWall
                    key={wall.id}
                    wall={wall}
                    zIndex={index}
                    isDrawingMode={tool !== 'cursor'}'''

target_area = '''                  <EditableArea
                    key={area.id}
                    area={area}
                    zIndex={index}'''

replacement_area = '''                  <EditableArea
                    key={area.id}
                    area={area}
                    zIndex={index}
                    isDrawingMode={tool !== 'cursor'}'''

if target_wall in content:
    content = content.replace(target_wall, replacement_wall)
if target_area in content:
    content = content.replace(target_area, replacement_area)

with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed [id].tsx.")
