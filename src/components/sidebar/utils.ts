import type { VirtualNode } from '../../stores/fileStore';
import type { VisibleNode } from './types';

export const collectVisibleNodes = (
  node: VirtualNode,
  result: VisibleNode[] = [],
  level = 0
): VisibleNode[] => {
  result.push({ node, level });
  
  if (node.type === 'folder' && node.isExpanded && node.children) {
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    sortedChildren.forEach(child => {
      collectVisibleNodes(child, result, level + 1);
    });
  }
  
  return result;
};

export const findParentNode = (root: VirtualNode, targetId: string): VirtualNode | null => {
  if (root.children) {
    for (const child of root.children.values()) {
      if (child.id === targetId) {
        return root;
      }
      const found = findParentNode(child, targetId);
      if (found) return found;
    }
  }
  return null;
};

export const sortChildren = (children: VirtualNode[]): VirtualNode[] => {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};
