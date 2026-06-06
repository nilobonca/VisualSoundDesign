# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_remove = '''        <div className="absolute inset-0 z-0">
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 9999 }}>
            {currentWallPoints.length > 0 && (
              <polyline
                points={currentWallPoints.map(p => \\,\\).join(' ')}
                fill="none"
                stroke="#444444"
                strokeWidth={8}
                opacity={0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {currentAreaPoints.length > 0 && (
              <polygon
                points={currentAreaPoints.map(p => \\,\\).join(' ')}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
          </svg>
          <CanvasContainer'''

replacement_remove = '''        <div className="absolute inset-0 z-0">
          <CanvasContainer'''

target_add = '''            onSelectionChange={handleSelectionChange}
          >
            {/* Render items based on Layer Order */}'''

replacement_add = '''            onSelectionChange={handleSelectionChange}
          >
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 9999, pointerEvents: 'none' }}>
              {currentWallPoints.length > 0 && (
                <polyline
                  points={currentWallPoints.map(p => \\,\\).join(' ')}
                  fill="none"
                  stroke="#444444"
                  strokeWidth={8}
                  opacity={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {currentAreaPoints.length > 0 && (
                <polygon
                  points={currentAreaPoints.map(p => \\,\\).join(' ')}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </svg>
            {/* Render items based on Layer Order */}'''

if target_remove in content and target_add in content:
    content = content.replace(target_remove, replacement_remove)
    content = content.replace(target_add, replacement_add)
    with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SVG moved successfully.")
else:
    print("Targets not found!")
