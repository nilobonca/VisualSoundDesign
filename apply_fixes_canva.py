import re

filepath = "src/components/Canva/canva-teste.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: setDynamicCanvasSize to strictly bail out if same or NaN
content = content.replace(
    """    setDynamicCanvasSize(prev => {
      const next = Math.max(prev, neededSize);
      if (next > prev) return next;
      return prev;
    });""",
    """    setDynamicCanvasSize(prev => {
      const next = Math.max(prev, neededSize);
      if (next > prev && isFinite(next)) return next;
      return prev;
    });"""
)

# Fix 2: setTransform constrainBounds inside useEffect
# We want to prevent infinite loop if constrainBounds returns a new object but same values
content = content.replace(
    """  useEffect(() => {
    setTransform(prev => constrainBounds(prev.x, prev.y, prev.k));
  }, [constrainBounds]);""",
    """  useEffect(() => {
    setTransform(prev => {
      const next = constrainBounds(prev.x, prev.y, prev.k);
      if (prev.x === next.x && prev.y === next.y && prev.k === next.k) return prev;
      return next;
    });
  }, [constrainBounds]);"""
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("canva-teste.tsx fixed")
