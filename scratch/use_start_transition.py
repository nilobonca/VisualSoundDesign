import re

filepath = "src/utils/indexedDB/index.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Ensure startTransition is imported
if "startTransition" not in content[:200]:
    content = content.replace("import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';", 
                              "import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode, startTransition } from 'react';")

# Replace updatePinPersisted
old_pin = """    const updatePinPersisted = useCallback((pin: ActivePin) => {
        setActivePins(prev => prev.map(p => p.id === pin.id ? pin : p));
        updateItemPersisted(pin, 'Pin');"""

new_pin = """    const updatePinPersisted = useCallback((pin: ActivePin) => {
        startTransition(() => {
            setActivePins(prev => prev.map(p => p.id === pin.id ? pin : p));
        });
        updateItemPersisted(pin, 'Pin');"""

# Replace updateAreaPersisted
old_area = """    const updateAreaPersisted = useCallback((area: ActiveArea) => {
        setActiveAreas(prev => prev.map(a => a.id === area.id ? area : a));
        updateItemPersisted(area, 'Area');"""

new_area = """    const updateAreaPersisted = useCallback((area: ActiveArea) => {
        startTransition(() => {
            setActiveAreas(prev => prev.map(a => a.id === area.id ? area : a));
        });
        updateItemPersisted(area, 'Area');"""

# Replace updateWallPersisted
old_wall = """    const updateWallPersisted = useCallback((wall: ActiveWall) => {
        setActiveWalls(prev => prev.map(w => w.id === wall.id ? wall : w));
        updateItemPersisted(wall, 'Wall');"""

new_wall = """    const updateWallPersisted = useCallback((wall: ActiveWall) => {
        startTransition(() => {
            setActiveWalls(prev => prev.map(w => w.id === wall.id ? wall : w));
        });
        updateItemPersisted(wall, 'Wall');"""

# Replace updateImagePersisted
old_img = """    const updateImagePersisted = useCallback((image: ActiveImage) => {
        setActiveImages(prev => prev.map(i => i.id === image.id ? image : i));
        updateItemPersisted(image, 'Image');"""

new_img = """    const updateImagePersisted = useCallback((image: ActiveImage) => {
        startTransition(() => {
            setActiveImages(prev => prev.map(i => i.id === image.id ? image : i));
        });
        updateItemPersisted(image, 'Image');"""

content = content.replace(old_pin, new_pin)
content = content.replace(old_area, new_area)
content = content.replace(old_wall, new_wall)
content = content.replace(old_img, new_img)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Added startTransition")
