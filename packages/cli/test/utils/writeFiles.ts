import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface FileTree {
  [path: string]: string | FileTree;
}

export function writeFiles(tree: FileTree, basePath = '.'): void {
  for (const [path, content] of Object.entries(tree)) {
    const fullPath = basePath === '.' ? path : `${basePath}/${path}`;
    
    if (typeof content === 'string') {
      // Ensure directory exists
      const dir = dirname(fullPath);
      if (dir !== '.' && dir !== fullPath) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, content, 'utf8');
    } else {
      // Nested directory
      mkdirSync(fullPath, { recursive: true });
      writeFiles(content, fullPath);
    }
  }
}