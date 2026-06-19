import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix handleSelectionChange
content = content.replace(
    """  const handleSelectionChange = (rect: { x: number; y: number; width: number; height: number } | null) => {""",
    """  const handleSelectionChange = useCallback((rect: { x: number; y: number; width: number; height: number } | null) => {"""
)

# And add the closing bracket
content = content.replace(
    """    setSelectedItemIds(newSelectedIds);
  };

  const handleMultiSelect = (e: React.MouseEvent | React.PointerEvent | React.TouchEvent | undefined, id: string) => {""",
    """    setSelectedItemIds(newSelectedIds);
  }, [activeImages, activeAreas, activePins, activeSoundboardItems, activePlayers, activeNotes, setSelectedItemIds]);

  const handleMultiSelect = (e: React.MouseEvent | React.PointerEvent | React.TouchEvent | undefined, id: string) => {"""
)


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("[id].tsx handleSelectionChange fixed")
