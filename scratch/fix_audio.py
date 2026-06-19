import re

def replace_in_file(filepath, replacements):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

# 1. Update player-list
player_list_replacements = [
    ("interface AudioPlayerListProps {", "interface AudioPlayerListProps {\n    playerId?: string;"),
    ("id={`gm-audio-${audio.id}`}", "id={`gm-audio-${playerId || audio.id}`}")
]
replace_in_file("src/components/player-list/index.tsx", player_list_replacements)

# 2. Update EditableArea (passing playerId to AudioPlayerList)
editable_area_replacements = [
    ("""                            <AudioPlayerList
                                audio={audio}""",
     """                            <AudioPlayerList
                                playerId={area.id}
                                audio={audio}""")
]
replace_in_file("src/components/Canva/itens/editable-area.tsx", editable_area_replacements)

# 3. Update GlobalTracksMenu (passing playerId to AudioPlayerList)
global_tracks_replacements = [
    ("""                        <AudioPlayerList
                            audio={audio}""",
     """                        <AudioPlayerList
                            playerId={track.id}
                            audio={audio}""")
]
replace_in_file("src/components/GlobalTracksMenu/index.tsx", global_tracks_replacements)

# 4. Update player/index.tsx
player_replacements = [
    ("id={`gm-audio-${Player?.audio.id}`}", "id={`gm-audio-${Player?.id || Player?.audio.id}`}")
]
replace_in_file("src/components/player/index.tsx", player_replacements)

# 5. Update useAudioInteractions.ts
with open("src/hooks/useAudioInteractions.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_areas = False
in_global = False

for i, line in enumerate(lines):
    if "areas.forEach(area => {" in line:
        in_areas = True
        in_global = False
    elif "globalTracks.forEach(track => {" in line:
        in_areas = False
        in_global = True
    elif "graph.activeSources.forEach((src: any, areaId: string) => {" in line:
        in_areas = False
        in_global = False

    new_line = line
    
    if "const gmAudioEl = document.getElementById(`gm-audio-${audio.id}`) as HTMLAudioElement;" in line:
        if in_areas:
            new_line = line.replace("audio.id", "area.id")
        elif in_global:
            new_line = line.replace("audio.id", "track.id")
    
    if "audioId: audio.id" in line:
        if in_areas:
            new_line = line.replace("audioId: audio.id", "audioId: audio.id,\n                    playerId: area.id")
        elif in_global:
            new_line = line.replace("audioId: audio.id", "audioId: audio.id,\n                    playerId: track.id")

    if "const gmAudioEl = document.getElementById(`gm-audio-${src.audioId}`) as HTMLAudioElement;" in line:
        new_line = line.replace("src.audioId", "src.playerId || src.audioId")

    new_lines.append(new_line)

with open("src/hooks/useAudioInteractions.ts", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Audio fixes applied!")
