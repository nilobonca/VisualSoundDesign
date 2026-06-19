import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_str = "    const wallsStr = activeWalls.map(w => `${w.id}:${w.start.x},${w.start.y}-${w.end.x},${w.end.y}:${w.attenuation}`).join('|');"
new_str = "    const wallsStr = activeWalls.map(w => `${w.id}:${w.points.map(pt => `${pt.x},${pt.y}`).join(';')}:${w.mufflingFactor}`).join('|');"

content = content.replace(old_str, new_str)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed ActiveWall type")
