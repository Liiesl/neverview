import { useState, useCallback } from 'react';
import { X, Circle, FileCode } from 'lucide-react';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { useFileStore } from './stores/fileStore';
import './App.css';

function App() {
  const {
    rootFolder,
    allFiles,
    activeFile,
    activeFileId,
    tabs,
    updateFileContent,
    openFile,
    closeFile,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    toggleFolder,
    getPreviewContent,
    moveFile,
  } = useFileStore();

  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'git' | 'extensions'>('files');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleHTMLChange = useCallback((value: string | undefined) => {
    if (value !== undefined && activeFileId) {
      updateFileContent(activeFileId, value);
    }
  }, [activeFileId, updateFileContent]);

  const handleFileSelect = useCallback((fileId: string) => {
    openFile(fileId);
    setActiveFile(fileId);
  }, [openFile, setActiveFile]);

  const handleTabClick = useCallback((fileId: string) => {
    setActiveFile(fileId);
  }, [setActiveFile]);

  const handleTabClose = useCallback((e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  }, [closeFile]);

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.getElementById('editor-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / rect.height) * 100;
    
    if (percentage >= 20 && percentage <= 80) {
      setSplitRatio(percentage);
    }
  }, [isDragging]);

  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get preview content and path from active HTML file
  const previewContent = getPreviewContent();
  const previewPath = activeFile?.language === 'html' ? activeFile.path : '/NEVERVIEW/index.html';

  return (
    <div 
      className="app"
      onMouseMove={handleSplitDrag}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div className="content-area">
        <ActivityBar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        />
        
        {sidebarVisible && (
          <Sidebar 
            activeTab={activeTab}
            rootFolder={rootFolder}
            activeFileId={activeFileId}
            onFileSelect={handleFileSelect}
            onToggleFolder={toggleFolder}
            onCreateFile={createFile}
            onDeleteFile={deleteFile}
            onRenameFile={renameFile}
            onMoveFile={moveFile}
            sidebarWidth={sidebarWidth}
            onResize={setSidebarWidth}
          />
        )}
        <style>{`
          .content-area {
            --sidebar-width: ${sidebarWidth}px;
          }
        `}</style>
        
        <div className="main-content">
          {/* Tab Bar */}
          <div className="tab-bar">
            {tabs.map((tab) => (
              <div 
                key={tab.id}
                className={`tab ${tab.id === activeFileId ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="tab-icon">
                  {tab.language === 'html' && <FileCode size={14} className="tab-file-icon" style={{ color: '#e44d26' }} />}
                  {tab.language === 'css' && <FileCode size={14} className="tab-file-icon" style={{ color: '#264de4' }} />}
                  {tab.language === 'javascript' && <FileCode size={14} className="tab-file-icon" style={{ color: '#f7df1e' }} />}
                  {tab.language === 'typescript' && <FileCode size={14} className="tab-file-icon" style={{ color: '#3178c6' }} />}
                  {!['html', 'css', 'javascript', 'typescript'].includes(tab.language) && <FileCode size={14} className="tab-file-icon" />}
                </span>
                <span className={tab.isDirty ? 'tab-dirty' : ''}>{tab.name}</span>
                {tab.isDirty && <Circle size={8} className="tab-dirty-indicator" fill="currentColor" />}
                <button 
                  className="tab-close"
                  onClick={(e) => handleTabClose(e, tab.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div id="editor-container" className="editor-container">
            <div 
              className="editor-panel"
              style={{ height: `${splitRatio}%` }}
            >
              {activeFile ? (
                <Editor 
                  value={activeFile.content || ''}
                  language={activeFile.language || 'plaintext'}
                  fileId={activeFile.id}
                  onChange={handleHTMLChange}
                />
              ) : (
                <div className="no-editor">
                  <p>Select a file to start editing</p>
                </div>
              )}
            </div>
            
            <div 
              className="splitter"
              onMouseDown={startDrag}
            >
              <div className="splitter-handle" />
            </div>
            
            <div 
              className="preview-panel"
              style={{ height: `${100 - splitRatio}%` }}
            >
              <Preview htmlContent={previewContent} htmlPath={previewPath} allFiles={allFiles} />
            </div>
          </div>
        </div>
      </div>
      
      <StatusBar />
    </div>
  );
}

export default App;
