import { useRef, useCallback } from 'react';
import { FileType, FolderPlus } from 'lucide-react';
import { FileTreeNode } from './FileTreeNode';
import type { FileTreeProps } from './types';
import './Sidebar.css';

interface FileTreeComponentProps extends FileTreeProps {
  onContextMenu: (e: React.MouseEvent, nodeId: string, type: 'file' | 'folder') => void;
  onRootContextMenu: (e: React.MouseEvent) => void;
}

export function FileTree({
  rootFolder,
  activeFileId,
  focusedNodeId,
  creatingState,
  onFileSelect,
  onToggleFolder,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onContextMenu,
  onRootContextMenu,
  onFinishCreating,
  onFocusNode,
  onMoveFile,
  onHeaderNewFile,
  onHeaderNewFolder,
}: FileTreeComponentProps) {
  const fileTreeRef = useRef<HTMLDivElement>(null);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRootContextMenu(e);
  }, [onRootContextMenu]);

  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <span>EXPLORER</span>
        <div className="sidebar-actions">
          <button
            className="sidebar-action-btn"
            title="New File"
            onClick={onHeaderNewFile}
          >
            <FileType size={16} />
          </button>
          <button
            className="sidebar-action-btn"
            title="New Folder"
            onClick={onHeaderNewFolder}
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>
      <div
        ref={fileTreeRef}
        className="file-tree"
        onContextMenu={handleRootContextMenu}
      >
        <FileTreeNode
          node={rootFolder}
          level={0}
          activeFileId={activeFileId}
          focusedNodeId={focusedNodeId}
          isCreatingHere={creatingState?.nodeId === rootFolder.id}
          createType={creatingState?.type || null}
          onFileSelect={onFileSelect}
          onToggleFolder={onToggleFolder}
          onCreateFile={onCreateFile}
          onDeleteFile={onDeleteFile}
          onRenameFile={onRenameFile}
          onContextMenu={onContextMenu}
          onFinishCreating={onFinishCreating}
          onFocusNode={onFocusNode}
          onMoveFile={onMoveFile}
        />
      </div>
    </div>
  );
}
