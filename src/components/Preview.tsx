import { useRef, useEffect } from 'react';
import './Preview.css';

interface PreviewProps {
  htmlContent: string;
}

export function Preview({ htmlContent }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="preview-wrapper">
      <div className="preview-header">
        <span className="preview-header-text">Preview</span>
        <div className="preview-actions">
          <button 
            className="preview-action-btn" 
            onClick={handleRefresh}
            title="Refresh Preview"
          >
            🔄
          </button>
          <button 
            className="preview-action-btn" 
            onClick={handleOpenInNewTab}
            title="Open in New Tab"
          >
            ↗️
          </button>
        </div>
      </div>
      <div className="preview-content">
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="HTML Preview"
        />
      </div>
    </div>
  );
}
