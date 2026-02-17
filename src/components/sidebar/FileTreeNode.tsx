import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, File } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { sortChildren } from './utils';
import type { FileTreeNodeProps, DropPosition } from './types';
import type { VirtualNode } from '../../stores/fileStore';
import './Sidebar.css';

export function FileTreeNode({
  node,
  level,
  activeFileId,
  focusedNodeId,
  isCreatingHere,
  createType,
  onFileSelect,
  onToggleFolder,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onContextMenu,
  onFinishCreating,
  onFocusNode,
  onMoveFile,
}: FileTreeNodeProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [createValue, setCreateValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isActive = node.id === activeFileId;
  const isFocused = node.id === focusedNodeId;
  const indent = level * 17; // 16px for icon + 1px for spacing

  useEffect(() => {
    if (isCreatingHere && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingHere]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocusNode(node.id);
    if (node.type === 'folder') {
      onToggleFolder(node.id);
    } else {
      onFileSelect(node.id);
    }
  };

  const handleRename = () => {
    setIsRenaming(true);
    setRenameValue(node.name);
  };

  const handleRenameSubmit = () => {
    if (renameValue && renameValue !== node.name) {
      onRenameFile(node.id, renameValue);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(node.name);
    setIsRenaming(false);
  };

  const handleCreateSubmit = () => {
    if (createValue && node.type === 'folder') {
      onCreateFile(node.id, createValue, createType!);
    }
    setCreateValue('');
    onFinishCreating();
  };

  const handleCreateCancel = () => {
    setCreateValue('');
    onFinishCreating();
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('fileId', node.id);
    e.dataTransfer.setData('nodeType', node.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!onMoveFile) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (node.type === 'folder') {
      if (y < height * 0.25) {
        setDropPosition('before');
      } else if (y > height * 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('inside');
      }
    } else {
      setDropPosition(y < height / 2 ? 'before' : 'after');
    }

    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropPosition(null);
  };

  const checkCircular = (n: VirtualNode, targetId: string): boolean => {
    if (n.id === targetId) return true;
    if (n.children) {
      for (const child of n.children.values()) {
        if (checkCircular(child, targetId)) return true;
      }
    }
    return false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const currentDropPosition = dropPosition;
    setDropPosition(null);

    if (!onMoveFile) return;

    const draggedId = e.dataTransfer.getData('fileId');
    if (!draggedId || draggedId === node.id) return;

    if (node.type === 'folder' && currentDropPosition === 'inside') {
      if (!checkCircular(node, draggedId)) {
        onMoveFile(draggedId, node.id);
        if (!node.isExpanded) {
          onToggleFolder(node.id);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFocused && !isRenaming && !isCreatingHere) {
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          handleRename();
          break;
        case 'Delete':
          e.preventDefault();
          if (confirm(`Delete "${node.name}"?`)) {
            onDeleteFile(node.id);
          }
          break;
      }
    }
  };

  useEffect(() => {
    const nodeElement = nodeRef.current;
    if (nodeElement) {
      nodeElement.addEventListener('keydown', handleKeyDown as any);
      return () => {
        nodeElement.removeEventListener('keydown', handleKeyDown as any);
      };
    }
  }, [isFocused, isRenaming, isCreatingHere, node.name, node.id]);

  const getDropClass = () => {
    if (!isDragOver || !dropPosition) return '';
    return `drop-${dropPosition}`;
  };

  return (
    <>
      <div
        ref={nodeRef}
        className={`tree-node ${node.type} ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''} ${isDragging ? 'dragging' : ''} ${getDropClass()}`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFocusNode(node.id);
          onContextMenu(e, node.id, node.type);
        }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        data-node-id={node.id}
      >
        {node.type === 'folder' && (
          <span className="tree-chevron">
            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}

        {node.type === 'folder' ? (
          node.isExpanded ?
            <FolderOpen size={16} className="tree-folder-icon" /> :
            <Folder size={16} className="tree-folder-icon" />
        ) : (
          <FileIcon name={node.name} isActive={isActive} />
        )}

        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            className="rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') handleRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="tree-label">{node.name}</span>
        )}

        {isDragOver && dropPosition === 'before' && <div className="drop-indicator drop-indicator-before" />}
        {isDragOver && dropPosition === 'after' && <div className="drop-indicator drop-indicator-after" />}
        {isDragOver && dropPosition === 'inside' && <div className="drop-indicator drop-indicator-inside" />}
      </div>

      {node.type === 'folder' && node.isExpanded && (
        <div className="tree-children">
          {isCreatingHere && (
            <div
              className="tree-node creating"
              style={{ paddingLeft: `${indent + 20}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              {createType === 'folder' ? <Folder size={16} /> : <File size={16} />}
              <input
                ref={inputRef}
                type="text"
                className="create-input"
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onBlur={handleCreateSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubmit();
                  if (e.key === 'Escape') handleCreateCancel();
                }}
                placeholder={createType === 'folder' ? 'folder name' : 'file name'}
              />
            </div>
          )}

          {node.children && sortChildren(Array.from(node.children.values())).map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeFileId={activeFileId}
              focusedNodeId={focusedNodeId}
              isCreatingHere={false}
              createType={null}
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
          ))}
        </div>
      )}
    </>
  );
}
