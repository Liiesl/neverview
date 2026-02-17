import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  FileCode, 
  Folder,
  FolderOpen,
  File,
  Trash2,
  Edit3,
  FileType,
  FolderPlus,
  FileJson,
  FileText,
  Image,
  Music,
  Video,
  FileArchive,
  Settings,
  GitBranch
} from 'lucide-react';
import type { VirtualNode } from '../stores/fileStore';
import './Sidebar.css';

interface SidebarProps {
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

// Extended file icon mappings matching VS Code
const getFileIcon = (name: string, isActive: boolean) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const className = `file-icon ${ext} ${isActive ? 'active' : ''}`;
  
  switch (ext) {
    // Web
    case 'html':
    case 'htm':
      return <FileCode size={16} className={className} style={{ color: '#e44d26' }} />;
    case 'css':
      return <FileCode size={16} className={className} style={{ color: '#264de4' }} />;
    case 'scss':
    case 'sass':
      return <FileCode size={16} className={className} style={{ color: '#cc6699' }} />;
    case 'less':
      return <FileCode size={16} className={className} style={{ color: '#1d365d' }} />;
    
    // JavaScript/TypeScript
    case 'js':
    case 'cjs':
    case 'mjs':
      return <FileCode size={16} className={className} style={{ color: '#f7df1e' }} />;
    case 'ts':
    case 'tsx':
    case 'mts':
      return <FileCode size={16} className={className} style={{ color: '#3178c6' }} />;
    
    // React JSX
    case 'jsx':
      return <FileCode size={16} className={className} style={{ color: '#61dafb' }} />;
    
    // JSON & Config
    case 'json':
      return <FileJson size={16} className={className} style={{ color: '#f7df1e' }} />;
    case 'yaml':
    case 'yml':
      return <FileCode size={16} className={className} style={{ color: '#cb171e' }} />;
    case 'toml':
      return <FileCode size={16} className={className} style={{ color: '#9c4121' }} />;
    
    // Vue
    case 'vue':
      return <FileCode size={16} className={className} style={{ color: '#4fc08d' }} />;
    
    // Markdown
    case 'md':
    case 'markdown':
      return <FileText size={16} className={className} style={{ color: '#083fa1' }} />;
    
    // Python
    case 'py':
    case 'pyc':
    case 'pyd':
      return <FileCode size={16} className={className} style={{ color: '#3776ab' }} />;
    
    // Rust
    case 'rs':
      return <FileCode size={16} className={className} style={{ color: '#dea584' }} />;
    
    // Go
    case 'go':
      return <FileCode size={16} className={className} style={{ color: '#00add8' }} />;
    
    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return <Image size={16} className={className} style={{ color: '#b7b73b' }} />;
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <Music size={16} className={className} style={{ color: '#a855f7' }} />;
    
    // Video
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'webm':
      return <Video size={16} className={className} style={{ color: '#f43f5e' }} />;
    
    // Archives
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
      return <FileArchive size={16} className={className} style={{ color: '#f59e0b' }} />;
    
    // Config files
    case 'env':
      return <Settings size={16} className={className} style={{ color: '#faf743' }} />;
    
    // Git
    case 'gitignore':
    case 'gitattributes':
      return <GitBranch size={16} className={className} style={{ color: '#f14e32' }} />;
    
    // Plain text
    case 'txt':
      return <FileText size={16} className={className} style={{ color: '#6b7280' }} />;
    
    default:
      return <File size={16} className={className} />;
  }
};

// Collect all nodes in flattened order for keyboard navigation
const collectVisibleNodes = (
  node: VirtualNode,
  result: { node: VirtualNode; level: number }[] = [],
  level = 0
): { node: VirtualNode; level: number }[] => {
  result.push({ node, level });
  
  if (node.type === 'folder' && node.isExpanded && node.children) {
    // Sort children: folders first, then files, both alphabetically
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

// Find the parent node of a given node
const findParentNode = (root: VirtualNode, targetId: string): VirtualNode | null => {
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

// Sort children helper
const sortChildren = (children: VirtualNode[]): VirtualNode[] => {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};

interface FileTreeNodeProps {
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

function FileTreeNode({ 
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
  onMoveFile
}: FileTreeNodeProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [createValue, setCreateValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isActive = node.id === activeFileId;
  const isFocused = node.id === focusedNodeId;
  const indent = level * 12;

  // Auto-focus input when creating
  useEffect(() => {
    if (isCreatingHere && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingHere]);

  // Handle keyboard events for renaming
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

  // Drag and drop handlers
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
      // For folders: top 25% = before, middle 50% = inside, bottom 25% = after
      if (y < height * 0.25) {
        setDropPosition('before');
      } else if (y > height * 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('inside');
      }
    } else {
      // For files: top 50% = before, bottom 50% = after
      setDropPosition(y < height / 2 ? 'before' : 'after');
    }
    
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropPosition(null);
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
      // Move into folder
      // Prevent dropping into own children
      const checkCircular = (n: VirtualNode, targetId: string): boolean => {
        if (n.id === targetId) return true;
        if (n.children) {
          for (const child of n.children.values()) {
            if (checkCircular(child, targetId)) return true;
          }
        }
        return false;
      };
      
      if (!checkCircular(node, draggedId)) {
        onMoveFile(draggedId, node.id);
        if (!node.isExpanded) {
          onToggleFolder(node.id);
        }
      }
    }
    // For reordering at same level, we'd need parent info and index
    // This is complex without passing more props, so we'll skip for now
  };

  // Handle F2 for rename
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

  // Get drop indicator class
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
          <span className="tree-chevron" onClick={(e) => {
            e.stopPropagation();
            onToggleFolder(node.id);
          }}>
            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        
        {node.type === 'folder' ? (
          node.isExpanded ? 
            <FolderOpen size={16} className="tree-folder-icon" /> : 
            <Folder size={16} className="tree-folder-icon" />
        ) : (
          getFileIcon(node.name, isActive)
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
        
        {/* Drop indicators */}
        {isDragOver && dropPosition === 'before' && <div className="drop-indicator drop-indicator-before" />}
        {isDragOver && dropPosition === 'after' && <div className="drop-indicator drop-indicator-after" />}
        {isDragOver && dropPosition === 'inside' && <div className="drop-indicator drop-indicator-inside" />}
      </div>

      {/* Render children sorted alphabetically with inline create input */}
      {node.type === 'folder' && node.isExpanded && (
        <div className="tree-children">
          {/* Inline create input at the beginning of children */}
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

// Context Menu Component
interface ContextMenuProps {
  x: number;
  y: number;
  _nodeId: string | null;
  nodeType: 'file' | 'folder' | null;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ContextMenu({ x, y, _nodeId: _nodeId, nodeType, onClose, onNewFile, onNewFolder, onRename, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
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
        zIndex: 1000
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
  onResize
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; nodeType: 'file' | 'folder' } | null>(null);
  const [rootContextMenu, setRootContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [creatingState, setCreatingState] = useState<{ nodeId: string; type: 'file' | 'folder' } | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const fileTreeRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Handle context menu for tree nodes
  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string, nodeType: 'file' | 'folder') => {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
    setRootContextMenu(null);
  }, []);

  // Handle root context menu (right-click on empty space)
  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      // Find the tree node and trigger rename
      const nodeElement = document.querySelector(`[data-node-id="${contextMenu.nodeId}"]`);
      if (nodeElement) {
        (nodeElement as HTMLElement).click();
        // Trigger rename via F2 simulation
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
              // Move to first child
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
              // Move to parent
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

  // Handle creating in root via header buttons
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
          <>
            <div className="sidebar-section">
              <div className="sidebar-header">
                <span>EXPLORER</span>
                <div className="sidebar-actions">
                  <button 
                    className="sidebar-action-btn" 
                    title="New File"
                    onClick={handleHeaderNewFile}
                  >
                    <FileType size={16} />
                  </button>
                  <button 
                    className="sidebar-action-btn" 
                    title="New Folder"
                    onClick={handleHeaderNewFolder}
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
                  onContextMenu={handleContextMenu}
                  onFinishCreating={() => setCreatingState(null)}
                  onFocusNode={setFocusedNodeId}
                  onMoveFile={onMoveFile}
                />
              </div>
            </div>
          </>
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
                  <div className="extension-icon">🔧</div>
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
      
      {/* Resize handle */}
      <div 
        ref={resizeHandleRef}
        className="sidebar-resize-handle"
        style={{ left: `${sidebarWidth + 48}px` }}
        title="Resize sidebar"
      />

      {/* Context menus */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          _nodeId={contextMenu.nodeId}
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
