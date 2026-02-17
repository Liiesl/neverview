import { useRef, useEffect, useCallback } from 'react';
import { processHtmlForPreview } from '../utils/previewEngine';
import type { VirtualNode } from '../stores/fileStore';
import './Preview.css';

interface PreviewProps {
  htmlContent: string;
  htmlPath: string;
  allFiles: Map<string, VirtualNode>;
}

export function Preview({ htmlContent, htmlPath, allFiles }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const processedHtmlRef = useRef<string>('');

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!doc) return;

    try {
      // Process HTML with dependency resolution
      const { html: processedHtml } = processHtmlForPreview(
        htmlContent,
        htmlPath,
        allFiles
      );
      
      processedHtmlRef.current = processedHtml;
      
      doc.open();
      doc.write(processedHtml);
      doc.close();
    } catch (error) {
      console.error('Error processing preview:', error);
      // Fallback to raw HTML
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }, [htmlContent, htmlPath, allFiles]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([processedHtmlRef.current || htmlContent], { type: 'text/html' });
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
