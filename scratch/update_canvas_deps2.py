import re

filepath = "src/components/Canva/canva-teste.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the dependency array
content = content.replace("  }, [itemsPositionHash, dynamicCanvasSize, items]);", "  }, [itemsPositionHash, dynamicCanvasSize]); // Omit items to prevent re-running on color/metadata changes")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Removed items from dependencies")
