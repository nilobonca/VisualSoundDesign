# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''                addWallPersisted({
                  id: Date.now(),
                  projectId: activeProjectId || 0,
                  name: Parede ,
                  points: currentWallPoints,
                  color: '#444444',
                  thickness: 8,
                  occludesAudio: true
                } as unknown as ActiveWall, activeProjectId);'''

replacement = '''                addWallPersisted({
                  id: Date.now().toString(),
                  type: 'wall',
                  projectId: activeProjectId || 0,
                  name: Parede ,
                  points: [...currentWallPoints],
                  color: '#444444',
                  thickness: 8,
                  occludesAudio: true
                } as unknown as ActiveWall, activeProjectId);'''

target_area = '''                addAreaPersisted({
                  id: Date.now(),
                  projectId: activeProjectId || 0,
                  name: Área ,
                  points: currentAreaPoints,
                  color: 'rgba(59, 130, 246, 0.2)', // default color
                  linkedAudioId: null,
                } as unknown as ActiveArea, activeProjectId);'''

replacement_area = '''                addAreaPersisted({
                  id: Date.now().toString(),
                  type: 'area',
                  projectId: activeProjectId || 0,
                  name: Área ,
                  points: [...currentAreaPoints],
                  color: 'rgba(59, 130, 246, 0.2)', // default color
                  linkedAudioId: null,
                } as unknown as ActiveArea, activeProjectId);'''

if target in content:
    content = content.replace(target, replacement)
if target_area in content:
    content = content.replace(target_area, replacement_area)

with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added type and id string casting.")
