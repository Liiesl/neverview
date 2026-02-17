import type { VirtualNode } from '../../stores/fileStore';

export interface SidebarProps {
  activeTab: 'files' | 'search' | 'git' | 'extensions';
  rootFolder: VirtualNode;
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (parentFolderId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onMoveFile?: (fileId: string, targetFolderId: string, targetIndex?: number) => void;
  sidebarWidth: number;
  onResize: (width: number) => void;
}

export interface FileTreeNodeProps {
  node: VirtualNode;
  level: number;
  activeFileId: string | null;
  focusedNodeId: string | null;
  isCreatingHere: boolean;
  createType: 'file' | 'folder' | null;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (parentFolderId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string, type: 'file' | 'folder') => void;
  onFinishCreating: () => void;
  onFocusNode: (nodeId: string) => void;
  onMoveFile?: (fileId: string, targetFolderId: string, targetIndex?: number) => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: 'file' | 'folder' | null;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export interface VisibleNode {
  node: VirtualNode;
  level: number;
}

export type DropPosition = 'before' | 'after' | 'inside' | null;

export type CreateState = {
  nodeId: string;
  type: 'file' | 'folder';
} | null;

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeType: 'file' | 'folder';
}

export interface RootContextMenuState {
  x: number;
  y: number;
}

export interface FileTreeProps {
  rootFolder: VirtualNode;
  activeFileId: string | null;
  focusedNodeId: string | null;
  creatingState: CreateState;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (parentFolderId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onFinishCreating: () => void;
  onFocusNode: (nodeId: string) => void;
  onMoveFile?: (fileId: string, targetFolderId: string, targetIndex?: number) => void;
  onHeaderNewFile: () => void;
  onHeaderNewFolder: () => void;
}
