import re

filepath = "src/hooks/useAudioInteractions.ts"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace gm-audio-${audio.id} with gm-audio-${area.id} inside Areas loop
# Need to be careful. In Areas loop:
content = re.sub(
    r"const gmAudioEl = document\.getElementById\(`gm-audio-\$\{audio\.id\}`\) as HTMLAudioElement;",
    r"const gmAudioEl = document.getElementById(`gm-audio-${area ? area.id : track ? track.id : audio.id}`) as HTMLAudioElement;",
    content
)
# Wait, let's just make it simpler. We can just replace it specifically!
