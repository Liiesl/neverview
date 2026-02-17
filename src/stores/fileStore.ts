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

const defaultCSS = `/* Add your CSS styles here */

body {
  margin: 0;
  padding: 0;
}`;

const defaultJS = `// Add your JavaScript code here

console.log('Hello from NeverView!');`;

const getDefaultContent = (language: Language): string => {
  switch (language) {
    case 'html':
      return defaultHTML;
    case 'css':
      return defaultCSS;
    case 'javascript':
      return defaultJS;
    default:
      return '';
  }
};

export const useFileStore = () => {
  // Root folder
  const [rootFolder, setRootFolder] = useState<VirtualNode>(() => {
    const rootId = generateId();
    const indexHtmlId = generateId();
    
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
          content: defaultHTML,
          language: 'html',
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
    return indexHtml ? [indexHtml[0]] : [];
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
      const newRoot = { ...prev };
      
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
  };
};

export type FileStore = ReturnType<typeof useFileStore>;
