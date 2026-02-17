import { 
  Files, 
  Search, 
  GitBranch, 
  Puzzle,
  PanelLeft
} from 'lucide-react';
import './ActivityBar.css';

interface ActivityBarProps {
  activeTab: 'files' | 'search' | 'git' | 'extensions';
  onTabChange: (tab: 'files' | 'search' | 'git' | 'extensions') => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
}

export function ActivityBar({ 
  activeTab, 
  onTabChange, 
  sidebarVisible, 
  onToggleSidebar 
}: ActivityBarProps) {
  const tabs = [
    { id: 'files' as const, icon: Files, label: 'Explorer' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'git' as const, icon: GitBranch, label: 'Source Control' },
    { id: 'extensions' as const, icon: Puzzle, label: 'Extensions' },
  ];

  return (
    <div className="activity-bar">
      <div className="activity-bar-top">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && sidebarVisible;
          
          return (
            <button
              key={tab.id}
              className={`activity-bar-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === tab.id && sidebarVisible) {
                  onToggleSidebar();
                } else {
                  onTabChange(tab.id);
                  if (!sidebarVisible) {
                    onToggleSidebar();
                  }
                }
              }}
              title={tab.label}
            >
              <Icon size={24} strokeWidth={1.5} />
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </div>
      
      <div className="activity-bar-bottom">
        <button
          className="activity-bar-item"
          onClick={onToggleSidebar}
          title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          <PanelLeft size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
