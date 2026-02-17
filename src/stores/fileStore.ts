import { useState, useCallback, useMemo } from 'react';

export type FileType = 'file' | 'folder';
export type Language = 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'plaintext';

export interface VirtualNode {
  id: string;
  name: string;
  type: FileType;
  path: string;
  content?: string;
  language?: Language;
  isDirty?: boolean;
  isOpen?: boolean;
  isExpanded?: boolean;
  children?: Map<string, VirtualNode>;
  parentId?: string | null;
}

export interface TabInfo {
  id: string;
  name: string;
  path: string;
  language: Language;
  isDirty: boolean;
}

const getLanguageFromExtension = (filename: string): Language => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const welcomeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>neverview</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
    <div class="app">
        <nav class="nav">
            <div class="nav-brand">neverview</div>
            <div class="nav-status">
                <span class="status-dot"></span>
                <span class="status-text">ready</span>
            </div>
        </nav>

        <main class="main">
            <header class="hero">
                <h1 class="hero-title">
                    <span class="prompt">$</span>
                    <span class="command">hello</span>
                    <span class="cursor">|</span>
                </h1>
                <p class="hero-subtitle">A minimal environment for HTML, CSS, and JavaScript.</p>
            </header>

            <section class="workflow">
                <div class="workflow-item">
                    <div class="workflow-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </div>
                    <div class="workflow-content">
                        <h3>Create</h3>
                        <p>Right-click in the file explorer to add new files and folders.</p>
                    </div>
                </div>

                <div class="workflow-item">
                    <div class="workflow-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </div>
                    <div class="workflow-content">
                        <h3>Edit</h3>
                        <p>Open files in the editor. Changes are tracked automatically.</p>
                    </div>
                </div>

                <div class="workflow-item">
                    <div class="workflow-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                        </svg>
                    </div>
                    <div class="workflow-content">
                        <h3>Preview</h3>
                        <p>See your work in real-time. Drag the handle to resize panels.</p>
                    </div>
                </div>
            </section>

            <section class="info">
                <div class="info-section">
                    <h4>Features</h4>
                    <ul class="info-list">
                        <li>Virtual file system with folder support</li>
                        <li>Live preview with dependency resolution</li>
                        <li>Multi-tab editor interface</li>
                        <li>In-memory storage (no persistence)</li>
                    </ul>
                </div>

                <div class="info-section">
                    <h4>Tips</h4>
                    <ul class="info-list">
                        <li>Use relative paths: <code>href="style.css"</code></li>
                        <li>Unsaved changes show a dot indicator</li>
                        <li>Preview follows the active HTML file</li>
                        <li>Drag the splitter to adjust layout</li>
                    </ul>
                </div>
            </section>
        </main>

        <footer class="footer">
            <span class="footer-item">neverview v1.0</span>
            <span class="footer-divider">·</span>
            <span class="footer-item">start editing to begin</span>
        </footer>
    </div>

    <script src="script.js"></script>
</body>
</html>`;

const welcomeCSS = `/* neverview — minimal developer aesthetic */

:root {
    --bg: #181818;
    --bg-elevated: #252526;
    --bg-hover: #2a2d2e;
    --border: #3e3e42;
    --text: #d4d4d4;
    --text-muted: #858585;
    --accent: #569cd6;
    --accent-glow: rgba(86, 156, 214, 0.15);
    --success: #4ec9b0;
    --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    font-size: 16px;
}

body {
    font-family: var(--font-ui);
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Layout */
.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 24px;
}

/* Navigation */
.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0;
    border-bottom: 1px solid var(--border);
}

.nav-brand {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: -0.01em;
}

.nav-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
}

.status-dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--success);
}

/* Main Content */
.main {
    flex: 1;
    padding: 64px 0;
}

/* Hero */
.hero {
    margin-bottom: 64px;
}

.hero-title {
    font-family: var(--font-mono);
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 400;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.prompt {
    color: var(--text-muted);
    user-select: none;
}

.command {
    color: var(--accent);
}

.cursor {
    color: var(--accent);
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    50% { opacity: 0; }
}

.hero-subtitle {
    font-size: 16px;
    color: var(--text-muted);
    line-height: 1.7;
    max-width: 480px;
}

/* Workflow */
.workflow {
    margin-bottom: 64px;
}

.workflow-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid var(--border);
    transition: all 0.2s ease;
}

.workflow-item:hover {
    padding-left: 8px;
}

.workflow-item:last-child {
    border-bottom: none;
}

.workflow-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: color 0.2s ease;
}

.workflow-item:hover .workflow-icon {
    color: var(--accent);
}

.workflow-icon svg {
    stroke-width: 1.5;
}

.workflow-content h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
    letter-spacing: -0.01em;
}

.workflow-content p {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.6;
}

/* Info Sections */
.info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 48px;
}

.info-section h4 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 16px;
}

.info-list {
    list-style: none;
}

.info-list li {
    font-size: 14px;
    color: var(--text);
    padding: 8px 0;
    padding-left: 16px;
    position: relative;
    line-height: 1.5;
}

.info-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 16px;
    width: 4px;
    height: 4px;
    background: var(--accent);
    border-radius: 50%;
    opacity: 0.6;
}

.info-list li code {
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--bg-elevated);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--accent);
}

/* Footer */
.footer {
    padding: 24px 0;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
}

.footer-divider {
    opacity: 0.4;
}

/* Responsive */
@media (max-width: 640px) {
    .app {
        padding: 0 20px;
    }
    
    .main {
        padding: 48px 0;
    }
    
    .hero {
        margin-bottom: 48px;
    }
    
    .workflow {
        margin-bottom: 48px;
    }
    
    .info {
        grid-template-columns: 1fr;
        gap: 32px;
    }
}`;

const welcomeJS = `// neverview — minimal developer environment

console.log('%cneverview', 'font-family: monospace; font-size: 14px; color: #569cd6;');
console.log('%cv1.0.0 — system ready', 'font-family: monospace; font-size: 11px; color: #858585;');
console.log('');

document.addEventListener('DOMContentLoaded', () => {
    // Subtle fade-in for workflow items
    const items = document.querySelectorAll('.workflow-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(8px)';
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 + (index * 80));
    });
    
    // Info sections stagger
    const infoSections = document.querySelectorAll('.info-section');
    infoSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(12px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 400 + (index * 100));
    });
    
    // Command typing effect
    const command = document.querySelector('.command');
    if (command) {
        const text = command.textContent;
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let iteration = 0;
        
        const interval = setInterval(() => {
            command.textContent = text
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return text[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if (iteration >= text.length) {
                clearInterval(interval);
            }
            
            iteration += 1/2;
        }, 40);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        name: 'neverview',
        version: '1.0.0',
        status: 'ready'
    };
}`;

const getDefaultContent = (language: Language): string => {
  switch (language) {
    case 'html':
      return welcomeHTML;
    case 'css':
      return welcomeCSS;
    case 'javascript':
      return welcomeJS;
    default:
      return '';
  }
};

export const useFileStore = () => {
  // Root folder
  const [rootFolder, setRootFolder] = useState<VirtualNode>(() => {
    const rootId = generateId();
    const indexHtmlId = generateId();
    const styleCssId = generateId();
    const scriptJsId = generateId();
    
    return {
      id: rootId,
      name: 'NEVERVIEW',
      type: 'folder',
      path: '/NEVERVIEW',
      isExpanded: true,
      children: new Map([
        [indexHtmlId, {
          id: indexHtmlId,
          name: 'index.html',
          type: 'file',
          path: '/NEVERVIEW/index.html',
          content: welcomeHTML,
          language: 'html',
          isDirty: false,
          isOpen: true,
          parentId: rootId,
        }],
        [styleCssId, {
          id: styleCssId,
          name: 'style.css',
          type: 'file',
          path: '/NEVERVIEW/style.css',
          content: welcomeCSS,
          language: 'css',
          isDirty: false,
          isOpen: true,
          parentId: rootId,
        }],
        [scriptJsId, {
          id: scriptJsId,
          name: 'script.js',
          type: 'file',
          path: '/NEVERVIEW/script.js',
          content: welcomeJS,
          language: 'javascript',
          isDirty: false,
          isOpen: true,
          parentId: rootId,
        }],
      ]),
    };
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    // Find index.html id
    const entries = Array.from(rootFolder.children?.entries() || []);
    const indexHtml = entries.find(([, node]) => node.name === 'index.html');
    return indexHtml?.[0] || '';
  });

  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const entries = Array.from(rootFolder.children?.entries() || []);
    const indexHtml = entries.find(([, node]) => node.name === 'index.html');
    const styleCss = entries.find(([, node]) => node.name === 'style.css');
    const scriptJs = entries.find(([, node]) => node.name === 'script.js');
    const files: string[] = [];
    if (indexHtml) files.push(indexHtml[0]);
    if (styleCss) files.push(styleCss[0]);
    if (scriptJs) files.push(scriptJs[0]);
    return files;
  });

  // Flatten all files for easier access
  const allFiles = useMemo(() => {
    const files = new Map<string, VirtualNode>();
    
    const traverse = (node: VirtualNode) => {
      files.set(node.id, node);
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };
    
    traverse(rootFolder);
    return files;
  }, [rootFolder]);

  const activeFile = useMemo(() => {
    return activeFileId ? allFiles.get(activeFileId) || null : null;
  }, [activeFileId, allFiles]);

  const tabs = useMemo(() => {
    return openFiles.map(id => {
      const file = allFiles.get(id);
      if (!file || file.type !== 'file') return null;
      return {
        id: file.id,
        name: file.name,
        path: file.path,
        language: file.language!,
        isDirty: file.isDirty || false,
      };
    }).filter((tab): tab is TabInfo => tab !== null);
  }, [openFiles, allFiles]);

  const getFileContent = useCallback((fileId: string): string => {
    const file = allFiles.get(fileId);
    return file?.content || '';
  }, [allFiles]);

  const getActiveFileContent = useCallback((): string => {
    return activeFile?.content || '';
  }, [activeFile]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setRootFolder(prev => {
      const newRoot = { ...prev };
      
      const updateNode = (node: VirtualNode): boolean => {
        if (node.id === fileId) {
          if (node.type === 'file') {
            node.content = content;
            node.isDirty = true;
          }
          return true;
        }
        if (node.children) {
          for (const [, child] of node.children) {
            if (updateNode(child)) return true;
          }
        }
        return false;
      };
      
      updateNode(newRoot);
      return newRoot;
    });
  }, []);

  const openFile = useCallback((fileId: string) => {
    setOpenFiles(prev => {
      if (prev.includes(fileId)) return prev;
      return [...prev, fileId];
    });
    setActiveFileId(fileId);
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(id => id !== fileId);
      
      // If closing active file, switch to another open file
      if (activeFileId === fileId && newOpenFiles.length > 0) {
        const index = prev.indexOf(fileId);
        const newIndex = index > 0 ? index - 1 : 0;
        setActiveFileId(newOpenFiles[newIndex]);
      } else if (newOpenFiles.length === 0) {
        setActiveFileId('');
      }
      
      return newOpenFiles;
    });

    // Update isOpen flag
    setRootFolder(prev => {
      const newRoot = { ...prev };
      
      const updateNode = (node: VirtualNode): boolean => {
        if (node.id === fileId) {
          node.isOpen = false;
          return true;
        }
        if (node.children) {
          for (const [, child] of node.children) {
            if (updateNode(child)) return true;
          }
        }
        return false;
      };
      
      updateNode(newRoot);
      return newRoot;
    });
  }, [activeFileId]);

  const setActiveFile = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const createFile = useCallback((parentFolderId: string, name: string, type: FileType = 'file') => {
    const newId = generateId();
    const parent = allFiles.get(parentFolderId);
    
    if (!parent || parent.type !== 'folder') return null;

    const newPath = `${parent.path}/${name}`;
    const language = type === 'file' ? getLanguageFromExtension(name) : undefined;
    const content = type === 'file' ? getDefaultContent(language!) : undefined;

    const newNode: VirtualNode = {
      id: newId,
      name,
      type,
      path: newPath,
      content,
      language,
      isDirty: false,
      isOpen: false,
      isExpanded: type === 'folder' ? false : undefined,
      children: type === 'folder' ? new Map() : undefined,
      parentId: parentFolderId,
    };

    setRootFolder(prev => {
      const newRoot = { ...prev };
      
      const addToParent = (node: VirtualNode): boolean => {
        if (node.id === parentFolderId) {
          if (!node.children) {
            node.children = new Map();
          }
          node.children.set(newId, newNode);
          return true;
        }
        if (node.children) {
          for (const [, child] of node.children) {
            if (addToParent(child)) return true;
          }
        }
        return false;
      };
      
      addToParent(newRoot);
      return newRoot;
    });

    // If it's a file, open it
    if (type === 'file') {
      setOpenFiles(prev => [...prev, newId]);
      setActiveFileId(newId);
    }

    return newNode;
  }, [allFiles]);

  const deleteFile = useCallback((fileId: string) => {
    const file = allFiles.get(fileId);
    if (!file) return;

    // Close file if open
    if (file.type === 'file' && file.isOpen) {
      closeFile(fileId);
    }

    setRootFolder(prev => {
      const newRoot = { ...prev };
      
      const removeFromParent = (node: VirtualNode): boolean => {
        if (node.children) {
          if (node.children.has(fileId)) {
            node.children.delete(fileId);
            return true;
          }
          for (const [, child] of node.children) {
            if (removeFromParent(child)) return true;
          }
        }
        return false;
      };
      
      removeFromParent(newRoot);
      return newRoot;
    });
  }, [allFiles, closeFile]);

  const renameFile = useCallback((fileId: string, newName: string) => {
    setRootFolder(prev => {
      const newRoot = { ...prev };
      
      const renameNode = (node: VirtualNode): boolean => {
        if (node.id === fileId) {
          node.name = newName;
          // Update path
          const parent = node.parentId ? allFiles.get(node.parentId) : null;
          if (parent) {
            node.path = `${parent.path}/${newName}`;
          }
          // Update language if file extension changed
          if (node.type === 'file') {
            node.language = getLanguageFromExtension(newName);
          }
          return true;
        }
        if (node.children) {
          for (const [, child] of node.children) {
            if (renameNode(child)) return true;
          }
        }
        return false;
      };
      
      renameNode(newRoot);
      return newRoot;
    });
  }, [allFiles]);

  const toggleFolder = useCallback((folderId: string) => {
    setRootFolder(prev => {
      const cloneNode = (node: VirtualNode): VirtualNode => {
        const cloned: VirtualNode = { ...node };
        if (node.children) {
          cloned.children = new Map(
            Array.from(node.children.entries()).map(([key, child]) => [key, cloneNode(child)])
          );
        }
        return cloned;
      };
      
      const newRoot = cloneNode(prev);
      
      const toggleNode = (node: VirtualNode): boolean => {
        if (node.id === folderId) {
          node.isExpanded = !node.isExpanded;
          return true;
        }
        if (node.children) {
          for (const [, child] of node.children) {
            if (toggleNode(child)) return true;
          }
        }
        return false;
      };
      
      toggleNode(newRoot);
      return newRoot;
    });
  }, []);

  const getAllHtmlContent = useCallback((): Record<string, string> => {
    const htmlFiles: Record<string, string> = {};
    
    const traverse = (node: VirtualNode) => {
      if (node.type === 'file' && node.language === 'html' && node.content) {
        htmlFiles[node.path] = node.content;
      }
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };
    
    traverse(rootFolder);
    return htmlFiles;
  }, [rootFolder]);

  const getPreviewContent = useCallback((): string => {
    // Return active HTML file content or first HTML file
    if (activeFile?.language === 'html') {
      return activeFile.content || '';
    }
    
    // Find index.html or first HTML file
    const htmlFiles = getAllHtmlContent();
    return htmlFiles['/NEVERVIEW/index.html'] || Object.values(htmlFiles)[0] || '';
  }, [activeFile, getAllHtmlContent]);

  const moveFile = useCallback((fileId: string, targetFolderId: string, targetIndex?: number) => {
    // Helper function to deep clone a VirtualNode with proper Map handling
    const cloneNode = (node: VirtualNode): VirtualNode => {
      const cloned: VirtualNode = { ...node };
      if (node.children) {
        cloned.children = new Map();
        for (const [key, child] of node.children) {
          cloned.children.set(key, cloneNode(child));
        }
      }
      return cloned;
    };

    const fileToMove = allFiles.get(fileId);
    const targetFolder = allFiles.get(targetFolderId);

    if (!fileToMove || !targetFolder) return;
    if (targetFolder.type !== 'folder') return;

    // If same parent and no targetIndex specified, do nothing
    if (fileToMove.parentId === targetFolderId && targetIndex === undefined) return;

    setRootFolder(prev => {
      // Deep clone the entire tree
      const newRoot = cloneNode(prev);
      let movedNode: VirtualNode | undefined;
      let sourceParentId: string | null = null;

      // Remove from current parent
      const removeFromParent = (node: VirtualNode): boolean => {
        if (node.children) {
          if (node.children.has(fileId)) {
            const nodeToMove = node.children.get(fileId);
            if (nodeToMove) {
              movedNode = nodeToMove;
              sourceParentId = node.id;
              node.children.delete(fileId);
            }
            return true;
          }
          for (const [, child] of node.children) {
            if (removeFromParent(child)) return true;
          }
        }
        return false;
      };

      removeFromParent(newRoot);

      if (movedNode) {
        // Create updated node with new parent and cloned children
        const updatedNode: VirtualNode = {
          ...movedNode,
          path: `${targetFolder.path}/${movedNode.name}`,
          parentId: targetFolderId
        };

        // Add to target parent at specified index
        const addToParentAtIndex = (node: VirtualNode): boolean => {
          if (node.id === targetFolderId) {
            if (!node.children) {
              node.children = new Map();
            }

            // If targetIndex is specified, we need to reorder
            if (targetIndex !== undefined) {
              // Convert Map to array to manipulate order
              const childrenArray = Array.from(node.children.entries());

              // Calculate insert index
              let insertIndex = targetIndex;
              if (sourceParentId === targetFolderId) {
                // Moving within same parent - need to adjust for the removed item
                const oldIndex = childrenArray.findIndex(([id]) => id === fileId);
                if (oldIndex !== -1 && oldIndex < insertIndex) {
                  insertIndex--;
                }
              }

              // Clamp index to valid range
              insertIndex = Math.max(0, Math.min(insertIndex, childrenArray.length));

              // Insert at specified position
              childrenArray.splice(insertIndex, 0, [fileId, updatedNode]);

              // Convert back to Map
              node.children = new Map(childrenArray);
            } else {
              // Just append to end
              node.children.set(fileId, updatedNode);
            }
            return true;
          }
          if (node.children) {
            for (const [, child] of node.children) {
              if (addToParentAtIndex(child)) return true;
            }
          }
          return false;
        };

        addToParentAtIndex(newRoot);
      }

      return newRoot;
    });
  }, [allFiles]);

  return {
    rootFolder,
    allFiles,
    activeFile,
    activeFileId,
    openFiles,
    tabs,
    getFileContent,
    getActiveFileContent,
    updateFileContent,
    openFile,
    closeFile,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    toggleFolder,
    getAllHtmlContent,
    getPreviewContent,
    moveFile,
  };
};

export type FileStore = ReturnType<typeof useFileStore>;
