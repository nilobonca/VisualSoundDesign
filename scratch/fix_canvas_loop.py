import re

filepath = "src/components/Canva/canva-teste.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """    const neededSize = calculateRequiredSize();

    setDynamicCanvasSize(prev => {
      const next = Math.max(prev, neededSize);
      // Explicitly return prev if next is not greater to avoid any React infinite loop
      // also guards against NaN comparisons
      if (next > prev) return next;
      return prev;
    });

  }, [items]);"""

new_code = """    const neededSize = calculateRequiredSize();

    // Only update if the required size is strictly greater than the current size
    // Checking this OUTSIDE of setState prevents flooding React's update queue
    if (neededSize > dynamicCanvasSize) {
      setDynamicCanvasSize(neededSize);
    }

  }, [items, dynamicCanvasSize]);"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed CanvasContainer useEffect infinite loop")
