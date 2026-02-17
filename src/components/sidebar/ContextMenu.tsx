import { useEffect, useRef } from 'react';
import { FileType, FolderPlus, Edit3, Trash2 } from 'lucide-react';
import type { ContextMenuProps } from './types';
import './Sidebar.css';

export function ContextMenu({
  x,
  y,
  nodeType,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 150);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {nodeType === 'folder' && (
        <>
          <button onClick={onNewFile}>
            <FileType size={14} /> New File
          </button>
          <button onClick={onNewFolder}>
            <FolderPlus size={14} /> New Folder
          </button>
          <div className="context-menu-divider" />
        </>
      )}
      <button onClick={onRename}>
        <Edit3 size={14} /> Rename
      </button>
      <button onClick={onDelete} className="danger">
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
