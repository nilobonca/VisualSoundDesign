import re

filepath = "src/components/player-list/index.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const AudioPlayerList: React.FC<AudioPlayerListProps> = ({",
    "const AudioPlayerList: React.FC<AudioPlayerListProps> = ({\n    playerId,"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed playerId destructuring in player-list")
