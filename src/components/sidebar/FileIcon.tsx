import { FileCode, FileJson, FileText, Image, Music, Video, FileArchive, Settings, GitBranch, File } from 'lucide-react';

interface FileIconProps {
  name: string;
  isActive: boolean;
}

export function FileIcon({ name, isActive }: FileIconProps) {
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
}
