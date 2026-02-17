import { useState, useCallback } from 'react';
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
  FolderPlus
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
}

const getFileIcon = (name: string, isActive: boolean) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const className = `file-icon ${ext} ${isActive ? 'active' : ''}`;
  
  switch (ext) {
    case 'html':
    case 'htm':
      return <FileCode size={16} className={className} style={{ color: '#e44d26' }} />;
    case 'css':
      return <FileCode size={16} className={className} style={{ color: '#264de4' }} />;
    case 'js':
    case 'jsx':
      return <FileCode size={16} className={className} style={{ color: '#f7df1e' }} />;
    case 'ts':
    case 'tsx':
      return <FileCode size={16} className={className} style={{ color: '#3178c6' }} />;
    case 'json':
      return <FileCode size={16} className={className} style={{ color: '#ccc' }} />;
    default:
      return <File size={16} className={className} />;
  }
};

interface FileTreeNodeProps {
  node: VirtualNode;
  level: number;
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (parentFolderId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

function FileTreeNode({ 
  node, 
  level, 
  activeFileId, 
  onFileSelect, 
  onToggleFolder,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}: FileTreeNodeProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [createValue, setCreateValue] = useState('');

  const handleClick = () => {
    if (node.type === 'folder') {
      onToggleFolder(node.id);
    } else {
      onFileSelect(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setShowContextMenu(false);
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

  const handleDelete = () => {
    setShowContextMenu(false);
    if (confirm(`Delete "${node.name}"?`)) {
      onDeleteFile(node.id);
    }
  };

  const handleCreate = (type: 'file' | 'folder') => {
    setShowContextMenu(false);
    if (node.type === 'folder') {
      setIsCreating(type);
      setCreateValue('');
    }
  };

  const handleCreateSubmit = () => {
    if (createValue && node.type === 'folder') {
      onCreateFile(node.id, createValue, isCreating!);
    }
    setIsCreating(null);
    setCreateValue('');
  };

  const handleCreateCancel = () => {
    setIsCreating(null);
    setCreateValue('');
  };

  // Close context menu when clicking outside
  const handleDocumentClick = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const isActive = node.id === activeFileId;
  const indent = level * 12;

  return (
    <>
      <div 
        className={`tree-node ${node.type} ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
          getFileIcon(node.name, isActive)
        )}

        {isRenaming ? (
          <input
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
            autoFocus
          />
        ) : (
          <span className="tree-label">{node.name}</span>
        )}
      </div>

      {/* Create new file/folder input */}
      {isCreating && (
        <div 
          className="tree-node creating"
          style={{ paddingLeft: `${indent + 28}px` }}
        >
          {isCreating === 'folder' ? <Folder size={16} /> : <File size={16} />}
          <input
            type="text"
            className="create-input"
            value={createValue}
            onChange={(e) => setCreateValue(e.target.value)}
            onBlur={handleCreateSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit();
              if (e.key === 'Escape') handleCreateCancel();
            }}
            placeholder={isCreating === 'folder' ? 'folder name' : 'file name'}
            autoFocus
          />
        </div>
      )}

      {/* Render children */}
      {node.type === 'folder' && node.isExpanded && node.children && (
        <div className="tree-children">
          {Array.from(node.children.values()).map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div 
            className="context-menu-overlay"
            onClick={handleDocumentClick}
          />
          <div 
            className="context-menu"
            style={{ 
              position: 'fixed',
              left: contextMenuPos.x, 
              top: contextMenuPos.y 
            }}
          >
            {node.type === 'folder' && (
              <>
                <button onClick={() => handleCreate('file')}>
                  <FileType size={14} /> New File
                </button>
                <button onClick={() => handleCreate('folder')}>
                  <FolderPlus size={14} /> New Folder
                </button>
                <div className="context-menu-divider" />
              </>
            )}
            <button onClick={handleRename}>
              <Edit3 size={14} /> Rename
            </button>
            <button onClick={handleDelete} className="danger">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </>
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
  onRenameFile
}: SidebarProps) {
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
                    onClick={() => onCreateFile(rootFolder.id, 'new-file.html', 'file')}
                  >
                    <FileType size={16} />
                  </button>
                  <button 
                    className="sidebar-action-btn" 
                    title="New Folder"
                    onClick={() => onCreateFile(rootFolder.id, 'new-folder', 'folder')}
                  >
                    <FolderPlus size={16} />
                  </button>
                </div>
              </div>
              <div className="file-tree">
                <FileTreeNode
                  node={rootFolder}
                  level={0}
                  activeFileId={activeFileId}
                  onFileSelect={onFileSelect}
                  onToggleFolder={onToggleFolder}
                  onCreateFile={onCreateFile}
                  onDeleteFile={onDeleteFile}
                  onRenameFile={onRenameFile}
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
    <div className="sidebar">
      {renderContent()}
    </div>
  );
}
