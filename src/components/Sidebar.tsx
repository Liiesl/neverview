import { 
  ChevronDown, 
  FileCode, 
  FolderOpen
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: 'files' | 'search' | 'git' | 'extensions';
}

export function Sidebar({ activeTab }: SidebarProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <>
            <div className="sidebar-section">
              <div className="sidebar-header">
                <span>EXPLORER</span>
              </div>
              <div className="file-tree">
                <div className="folder-item expanded">
                  <div className="folder-header">
                    <ChevronDown size={16} />
                    <FolderOpen size={16} className="folder-icon" />
                    <span>NEVERVIEW</span>
                  </div>
                  <div className="folder-children">
                    <div className="file-item active">
                      <span className="file-indent" />
                      <FileCode size={16} className="file-icon html" />
                      <span>index.html</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-section">
              <div className="sidebar-header">
                <span>OUTLINE</span>
              </div>
              <div className="outline-content">
                <div className="outline-item">
                  <span className="outline-tag">html</span>
                </div>
                <div className="outline-item indented">
                  <span className="outline-tag">head</span>
                </div>
                <div className="outline-item indented">
                  <span className="outline-tag">body</span>
                </div>
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
