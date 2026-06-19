import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_str = "    const tracksStr = activeGlobalTracks.map(t => `${t.id}:${t.audioFileId}`).join('|');"
new_str = "    const tracksStr = activeGlobalTracks.map(t => `${t.id}:${t.linkedAudioId}`).join('|');"

content = content.replace(old_str, new_str)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed ActiveGlobalTrack type")
