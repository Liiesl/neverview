import { Check, X, AlertTriangle } from 'lucide-react';
import './StatusBar.css';

export function StatusBar() {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-item branch">
          <span>main*</span>
        </div>
        <div className="status-item errors">
          <X size={14} />
          <span>0</span>
        </div>
        <div className="status-item warnings">
          <AlertTriangle size={14} />
          <span>0</span>
        </div>
      </div>
      
      <div className="status-bar-right">
        <div className="status-item">
          <span>Ln 1, Col 1</span>
        </div>
        <div className="status-item">
          <span>UTF-8</span>
        </div>
        <div className="status-item">
          <span>HTML</span>
        </div>
        <div className="status-item">
          <Check size={14} />
          <span>Prettier</span>
        </div>
      </div>
    </div>
  );
}
