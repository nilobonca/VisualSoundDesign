import re

filepath = "src/pages/project/[id].tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'import { useEffect, useState, DragEvent, ChangeEvent, useCallback, useRef } from "react";',
    'import { useEffect, useState, DragEvent, ChangeEvent, useCallback, useRef, useMemo } from "react";'
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Added useMemo import")
