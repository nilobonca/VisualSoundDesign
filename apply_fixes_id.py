import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix onCanvasRightClick
content = content.replace(
    """        onCanvasRightClick={(e, x, y) => {
          setContextMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX: x,
            worldY: y,
            type: 'canvas'
          });
        }}""",
    """        onCanvasRightClick={useCallback((e: React.MouseEvent, x: number, y: number) => {
          setContextMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX: x,
            worldY: y,
            type: 'canvas'
          });
        }, [setContextMenu])}"""
)

# Fix onCanvasClick
content = content.replace(
    """        onCanvasClick={(e, x, y) => {
          clearSelection();
          setContextMenu(null);
        }}""",
    """        onCanvasClick={useCallback((e: React.MouseEvent, x: number, y: number) => {
          clearSelection();
          setContextMenu(null);
        }, [clearSelection, setContextMenu])}"""
)

# Fix onCanvasMouseMove
content = content.replace(
    """        onCanvasMouseMove={(e, x, y) => {
          if (mousePosRef.current) {
            mousePosRef.current = { x, y };
          }
        }}""",
    """        onCanvasMouseMove={useCallback((e: React.MouseEvent, x: number, y: number) => {
          if (mousePosRef.current) {
            mousePosRef.current = { x, y };
          }
        }, [])}"""
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("[id].tsx callbacks fixed")
