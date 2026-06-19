import re

filepath = "src/components/Canva/ProjectCanvasContextMenu.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for useState and useEffect if not present
if "useState" not in content[:200]:
    content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';")

# Add the LocalInput components
local_inputs_code = """
const LocalColorInput = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  return <input type="color" value={localVal} className={className} onChange={(e) => {
    setLocalVal(e.target.value);
    onChange(e.target.value);
  }} />;
};

const LocalRangeInput = ({ value, min, max, step, onChange, className }: any) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  return <input type="range" min={min} max={max} step={step} value={localVal} className={className} onChange={(e) => {
    setLocalVal(e.target.value);
    onChange(e.target.value);
  }} />;
};
"""

if "LocalColorInput" not in content:
    insert_idx = content.find("interface ProjectCanvasContextMenuProps")
    content = content[:insert_idx] + local_inputs_code + "\n" + content[insert_idx:]

# Now replace color inputs
# We need to replace `<input \n type="color" \n value={...} \n onChange={(e) => { ... }} \n className="..." \n />`
# Actually, the python script can just use regex to replace all `<input type="color"` with `<LocalColorInput` and `<input type="range"` with `<LocalRangeInput` but we have to handle the `onChange={(e)` to `onChange={(val)` since our wrapper passes `e.target.value`.

# Let's do it manually via a safe string replace.
def replace_color_input(text):
    pattern = r'<input\s+type="color"\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => \{([^}]+e\.target\.value[^}]+)\}\}\s+className="([^"]+)"\s*/>'
    
    def repl(m):
        value = m.group(1)
        onchange_body = m.group(2).replace("e.target.value", "val")
        classname = m.group(3)
        return f'<LocalColorInput value={{{value}}} onChange={{(val) => {{{onchange_body}}}}} className="{classname}" />'
    
    return re.sub(pattern, repl, text)

def replace_range_input(text):
    pattern = r'<input\s+type="range"\s+min="([^"]+)"\s+max="([^"]+)"(?:\s+step="([^"]+)")?\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => \{([^}]+e\.target\.value[^}]+)\}\}\s+className="([^"]+)"\s*/>'
    
    def repl(m):
        min_v = m.group(1)
        max_v = m.group(2)
        step_v = m.group(3)
        value = m.group(4)
        onchange_body = m.group(5).replace("e.target.value", "val")
        classname = m.group(6)
        
        step_str = f' step="{step_v}"' if step_v else ''
        return f'<LocalRangeInput min="{min_v}" max="{max_v}"{step_str} value={{{value}}} onChange={{(val) => {{{onchange_body}}}}} className="{classname}" />'
    
    return re.sub(pattern, repl, text)

content = replace_color_input(content)
content = replace_range_input(content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProjectCanvasContextMenu.tsx with Local Inputs")
