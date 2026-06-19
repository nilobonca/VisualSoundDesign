import re

filepath = "src/components/Canva/canva-teste.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# I want to insert the useMemo before the useEffect
insert_idx = content.find("useEffect(() => {\n    const calculateRequiredSize")

if insert_idx != -1:
    memo_code = """  // Create a hash of all item positions and sizes to ONLY recalculate canvas size when items are dragged/resized
  const itemsPositionHash = React.useMemo(() => {
    return items.map(i => {
      if (i.position) return `${i.id}:${i.position.x},${i.position.y},${i.width},${i.height}`;
      if (i.points) return `${i.id}:` + i.points.map((p: any) => `${p.x},${p.y}`).join(';');
      return i.id;
    }).join('|');
  }, [items]);

  """
    
    # Insert the memo code
    content = content[:insert_idx] + memo_code + content[insert_idx:]
    
    # Replace the dependency array of the useEffect
    content = content.replace("  }, [items, dynamicCanvasSize]);", "  }, [itemsPositionHash, dynamicCanvasSize, items]);")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated canva-teste.tsx to use itemsPositionHash")
else:
    print("Could not find insertion point")
