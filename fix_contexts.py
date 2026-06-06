# -*- coding: utf-8 -*-
import sys

with open('src/pages/project/[id].tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();'''
replacement1 = '''                      onContextMenu={(e) => {
                        if (tool !== 'cursor') return;
                        e.preventDefault();
                        e.stopPropagation();'''

target2 = '''                    onRightClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();'''
replacement2 = '''                    onRightClick={(e) => {
                      if (tool !== 'cursor') return;
                      e.preventDefault();
                      e.stopPropagation();'''

target3 = '''                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Optional: Add context menu for notes
                      e.stopPropagation();'''
replacement3 = '''                    onContextMenu={(e) => {
                      if (tool !== 'cursor') return;
                      e.preventDefault();
                      // Optional: Add context menu for notes
                      e.stopPropagation();'''

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)
content = content.replace(target3, replacement3)

with open('src/pages/project/[id].tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Context menus fixed.")
