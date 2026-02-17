import { useState, useCallback } from 'react';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import './App.css';

const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        h1 { color: #333; }
        .card {
            background: #f5f5f5;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <div class="card">
        <p>Edit the HTML code on the left to see changes here.</p>
    </div>
</body>
</html>`;

function App() {
  const [htmlContent, setHtmlContent] = useState(defaultHTML);
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'git' | 'extensions'>('files');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleHTMLChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setHtmlContent(value);
    }
  }, []);

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
          <Sidebar activeTab={activeTab} />
        )}
        
        <div className="main-content">
          <div className="tab-bar">
            <div className="tab active">
              <span className="tab-icon">📄</span>
              <span>index.html</span>
              <button className="tab-close">×</button>
            </div>
          </div>
          
          <div id="editor-container" className="editor-container">
            <div 
              className="editor-panel"
              style={{ height: `${splitRatio}%` }}
            >
              <Editor 
                value={htmlContent}
                onChange={handleHTMLChange}
              />
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
              <Preview htmlContent={htmlContent} />
            </div>
          </div>
        </div>
      </div>
      
      <StatusBar />
    </div>
  );
}

export default App;
