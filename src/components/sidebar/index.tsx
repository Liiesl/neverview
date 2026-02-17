import { useState, useCallback, useEffect, useRef } from 'react';
import { FileType, FolderPlus, Puzzle } from 'lucide-react';
import { FileTree } from './FileTree';
import { ContextMenu } from './ContextMenu';
import { collectVisibleNodes, findParentNode } from './utils';
import type { SidebarProps, ContextMenuState, RootContextMenuState, CreateState } from './types';
import './Sidebar.css';

export function Sidebar({
  activeTab,
  rootFolder,
  activeFileId,
  onFileSelect,
  onToggleFolder,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onMoveFile,
  sidebarWidth,
  onResize,
  allFiles,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [rootContextMenu, setRootContextMenu] = useState<RootContextMenuState | null>(null);
  const [creatingState, setCreatingState] = useState<CreateState>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string, nodeType: 'file' | 'folder') => {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
    setRootContextMenu(null);
  }, []);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    setRootContextMenu({ x: e.clientX, y: e.clientY });
    setContextMenu(null);
  }, []);

  const closeContextMenus = useCallback(() => {
    setContextMenu(null);
    setRootContextMenu(null);
  }, []);

  const handleNewFile = useCallback(() => {
    if (contextMenu) {
      setCreatingState({ nodeId: contextMenu.nodeId, type: 'file' });
    }
    closeContextMenus();
  }, [contextMenu, closeContextMenus]);

  const handleNewFolder = useCallback(() => {
    if (contextMenu) {
      setCreatingState({ nodeId: contextMenu.nodeId, type: 'folder' });
    }
    closeContextMenus();
  }, [contextMenu, closeContextMenus]);

  const handleRootNewFile = useCallback(() => {
    setCreatingState({ nodeId: rootFolder.id, type: 'file' });
    closeContextMenus();
  }, [rootFolder.id, closeContextMenus]);

  const handleRootNewFolder = useCallback(() => {
    setCreatingState({ nodeId: rootFolder.id, type: 'folder' });
    closeContextMenus();
  }, [rootFolder.id, closeContextMenus]);

  const handleRename = useCallback(() => {
    if (contextMenu) {
      const nodeElement = document.querySelector(`[data-node-id="${contextMenu.nodeId}"]`);
      if (nodeElement) {
        (nodeElement as HTMLElement).click();
        setTimeout(() => {
          const event = new KeyboardEvent('keydown', { key: 'F2' });
          nodeElement.dispatchEvent(event);
        }, 50);
      }
    }
    closeContextMenus();
  }, [contextMenu, closeContextMenus]);

  const handleDelete = useCallback(() => {
    if (contextMenu && confirm(`Delete this ${contextMenu.nodeType}?`)) {
      onDeleteFile(contextMenu.nodeId);
    }
    closeContextMenus();
  }, [contextMenu, onDeleteFile, closeContextMenus]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'files') return;

      const visibleNodes = collectVisibleNodes(rootFolder);
      const currentIndex = visibleNodes.findIndex(n => n.node.id === focusedNodeId);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleNodes.length - 1) {
            setFocusedNodeId(visibleNodes[currentIndex + 1].node.id);
          } else if (!focusedNodeId && visibleNodes.length > 0) {
            setFocusedNodeId(visibleNodes[0].node.id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedNodeId(visibleNodes[currentIndex - 1].node.id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex >= 0) {
            const currentNode = visibleNodes[currentIndex].node;
            if (currentNode.type === 'folder' && !currentNode.isExpanded) {
              onToggleFolder(currentNode.id);
            } else if (currentNode.type === 'folder' && currentNode.isExpanded) {
              const children = Array.from(currentNode.children?.values() || []);
              if (children.length > 0) {
                setFocusedNodeId(children[0].id);
              }
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex >= 0) {
            const currentNode = visibleNodes[currentIndex].node;
            if (currentNode.type === 'folder' && currentNode.isExpanded) {
              onToggleFolder(currentNode.id);
            } else {
              const parent = findParentNode(rootFolder, currentNode.id);
              if (parent) {
                setFocusedNodeId(parent.id);
              }
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (currentIndex >= 0) {
            const currentNode = visibleNodes[currentIndex].node;
            if (currentNode.type === 'folder') {
              onToggleFolder(currentNode.id);
            } else {
              onFileSelect(currentNode.id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, focusedNodeId, rootFolder, onToggleFolder, onFileSelect]);

  // Scroll focused node into view
  useEffect(() => {
    if (focusedNodeId) {
      const element = document.querySelector(`[data-node-id="${focusedNodeId}"]`);
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedNodeId]);

  // Resize handler
  useEffect(() => {
    const handleRef = resizeHandleRef.current;
    if (!handleRef) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebarWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(150, Math.min(500, startWidth + delta));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    handleRef.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      handleRef.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth, onResize]);

  const handleHeaderNewFile = () => {
    setCreatingState({ nodeId: rootFolder.id, type: 'file' });
  };

  const handleHeaderNewFolder = () => {
    setCreatingState({ nodeId: rootFolder.id, type: 'folder' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <FileTree
            rootFolder={rootFolder}
            activeFileId={activeFileId}
            focusedNodeId={focusedNodeId}
            creatingState={creatingState}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
            onContextMenu={handleContextMenu}
            onRootContextMenu={handleRootContextMenu}
            onFinishCreating={() => setCreatingState(null)}
            onFocusNode={setFocusedNodeId}
            onMoveFile={onMoveFile}
            onHeaderNewFile={handleHeaderNewFile}
            onHeaderNewFolder={handleHeaderNewFolder}
            allFiles={allFiles}
          />
        );

      case 'search':
        return (
          <div className="sidebar-section">
            <div className="sidebar-header">
              <span>SEARCH</span>
            </div>
            <div className="search-content">
              <input
                type="text"
                className="search-input"
                placeholder="Search"
              />
              <input
                type="text"
                className="search-input"
                placeholder="Replace"
              />
            </div>
          </div>
        );

      case 'git':
        return (
          <div className="sidebar-section">
            <div className="sidebar-header">
              <span>SOURCE CONTROL</span>
            </div>
            <div className="git-content">
              <div className="git-message">
                No changes found
              </div>
            </div>
          </div>
        );

      case 'extensions':
        return (
          <div className="sidebar-section">
            <div className="sidebar-header">
              <span>EXTENSIONS</span>
            </div>
            <div className="extensions-content">
              <input
                type="text"
                className="search-input"
                placeholder="Search Extensions"
              />
              <div className="extensions-list">
                <div className="extension-item">
                  <div className="extension-icon"><Puzzle size={16} /></div>
                  <div className="extension-info">
                    <div className="extension-name">HTML Preview</div>
                    <div className="extension-desc">Built-in</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div
        className="sidebar"
        style={{ width: sidebarWidth }}
      >
        {renderContent()}
      </div>

      <div
        ref={resizeHandleRef}
        className="sidebar-resize-handle"
        style={{ left: `${sidebarWidth + 48}px` }}
        title="Resize sidebar"
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={closeContextMenus}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}

      {rootContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: Math.min(rootContextMenu.x, window.innerWidth - 180),
            top: Math.min(rootContextMenu.y, window.innerHeight - 100),
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleRootNewFile}>
            <FileType size={14} /> New File
          </button>
          <button onClick={handleRootNewFolder}>
            <FolderPlus size={14} /> New Folder
          </button>
        </div>
      )}
    </>
  );
}

export type { SidebarProps } from './types';
