import type { VirtualNode } from '../stores/fileStore';

interface ProcessedFile {
  content: string;
  blobUrl: string;
  dependencies: string[];
}

// Resolve a relative path to absolute path
const resolvePath = (basePath: string, relativePath: string): string => {
  // Handle absolute paths from root
  if (relativePath.startsWith('/')) {
    return relativePath;
  }
  
  // Handle protocol URLs (http, https, data, blob)
  if (/^[a-z]+:/.test(relativePath)) {
    return relativePath;
  }
  
  // Split paths
  const baseParts = basePath.split('/').filter(Boolean);
  const relParts = relativePath.split('/').filter(Boolean);
  
  // Remove filename from base if it's a file path
  if (baseParts.length > 0 && baseParts[baseParts.length - 1].includes('.')) {
    baseParts.pop();
  }
  
  // Process relative parts
  for (const part of relParts) {
    if (part === '..') {
      baseParts.pop();
    } else if (part !== '.') {
      baseParts.push(part);
    }
  }
  
  return '/' + baseParts.join('/');
};

// Find file by path in virtual file system
const findFileByPath = (
  files: Map<string, VirtualNode>,
  path: string
): VirtualNode | undefined => {
  for (const file of files.values()) {
    if (file.path === path && file.type === 'file') {
      return file;
    }
  }
  return undefined;
};

// Transform CSS @import statements to blob URLs
const transformCssImports = (
  css: string,
  basePath: string,
  files: Map<string, VirtualNode>,
  processedFiles: Map<string, ProcessedFile>
): string => {
  // Match @import url("...") or @import "..."
  const importRegex = /@import\s+(?:url\s*\(\s*)?["']([^"']+)["'](?:\s*\))?[^;]*;/g;
  
  return css.replace(importRegex, (match, importPath) => {
    const resolvedPath = resolvePath(basePath, importPath);
    const importedFile = findFileByPath(files, resolvedPath);
    
    if (!importedFile || !importedFile.content) {
      console.warn(`CSS import not found: ${importPath} (resolved to ${resolvedPath})`);
      return match;
    }
    
    // Process the imported CSS (handle nested imports)
    let importedContent = importedFile.content;
    const importedBasePath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/')) || '/';
    importedContent = transformCssImports(
      importedContent,
      importedBasePath,
      files,
      processedFiles
    );
    
    // Create blob URL for the imported CSS
    const blob = new Blob([importedContent], { type: 'text/css' });
    const blobUrl = URL.createObjectURL(blob);
    
    processedFiles.set(resolvedPath, {
      content: importedContent,
      blobUrl,
      dependencies: [],
    });
    
    return `@import url("${blobUrl}");`;
  });
};

// Transform ES6 module imports to blob URLs
const transformJsImports = (
  js: string,
  basePath: string,
  files: Map<string, VirtualNode>,
  processedFiles: Map<string, ProcessedFile>
): string => {
  // Match import statements: import ... from '...' or import ... from "..."
  const importRegex = /import\s+(?:(?:\{[^}]*\}|[^'"]*)\s+from\s+)?["']([^"']+)["'];?/g;
  
  return js.replace(importRegex, (match, importPath) => {
    // Skip external URLs and bare module specifiers (npm packages)
    if (/^[a-z]+:/.test(importPath) || !importPath.startsWith('.') && !importPath.startsWith('/')) {
      return match;
    }
    
    const resolvedPath = resolvePath(basePath, importPath);
    
    // Check if already processed
    if (processedFiles.has(resolvedPath)) {
      const processed = processedFiles.get(resolvedPath)!;
      return match.replace(importPath, processed.blobUrl);
    }
    
    const importedFile = findFileByPath(files, resolvedPath);
    
    if (!importedFile || !importedFile.content) {
      console.warn(`JS import not found: ${importPath} (resolved to ${resolvedPath})`);
      return match;
    }
    
    // Process the imported JS (handle nested imports)
    let importedContent = importedFile.content;
    const importedBasePath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/')) || '/';
    importedContent = transformJsImports(
      importedContent,
      importedBasePath,
      files,
      processedFiles
    );
    
    // Create blob URL for the imported module
    const blob = new Blob([importedContent], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    processedFiles.set(resolvedPath, {
      content: importedContent,
      blobUrl,
      dependencies: [],
    });
    
    return match.replace(importPath, blobUrl);
  });
};

// Process HTML content for preview
export const processHtmlForPreview = (
  htmlContent: string,
  htmlPath: string,
  files: Map<string, VirtualNode>
): { html: string; dependencies: string[] } => {
  const dependencies: string[] = [];
  const processedFiles = new Map<string, ProcessedFile>();
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const basePath = htmlPath.substring(0, htmlPath.lastIndexOf('/')) || '/';
  
  // Process CSS links
  const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]');
  cssLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip external URLs
    if (/^[a-z]+:/.test(href)) return;
    
    const resolvedPath = resolvePath(basePath, href);
    const cssFile = findFileByPath(files, resolvedPath);
    
    if (cssFile && cssFile.content) {
      dependencies.push(resolvedPath);
      
      // Process CSS imports
      let cssContent = cssFile.content;
      cssContent = transformCssImports(cssContent, basePath, files, processedFiles);
      
      // Replace link with inline style
      const style = doc.createElement('style');
      style.textContent = cssContent;
      link.parentNode?.replaceChild(style, link);
    } else {
      console.warn(`CSS file not found: ${href} (resolved to ${resolvedPath})`);
    }
  });
  
  // Process script tags
  const scripts = doc.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (!src) return;
    
    // Skip external URLs
    if (/^[a-z]+:/.test(src)) return;
    
    const resolvedPath = resolvePath(basePath, src);
    const jsFile = findFileByPath(files, resolvedPath);
    
    if (jsFile && jsFile.content) {
      dependencies.push(resolvedPath);
      
      let jsContent = jsFile.content;
      
      // If it's a module, transform imports
      if (script.getAttribute('type') === 'module') {
        jsContent = transformJsImports(jsContent, basePath, files, processedFiles);
      }
      
      // Replace external script with inline script
      const newScript = doc.createElement('script');
      if (script.getAttribute('type') === 'module') {
        newScript.setAttribute('type', 'module');
      }
      newScript.textContent = jsContent;
      script.parentNode?.replaceChild(newScript, script);
    } else {
      console.warn(`JS file not found: ${src} (resolved to ${resolvedPath})`);
    }
  });
  
  // Serialize back to HTML
  const serializer = new XMLSerializer();
  let processedHtml = serializer.serializeToString(doc);
  
  // DOMParser wraps in XML structure, remove the extra wrappers
  processedHtml = processedHtml.replace(/^<html xmlns="[^"]*"><head><\/head><body>/, '');
  processedHtml = processedHtml.replace(/<\/body><\/html>$/, '');
  
  return { html: processedHtml, dependencies };
};

// Get all dependencies recursively
export const getAllDependencies = (
  htmlPath: string,
  files: Map<string, VirtualNode>
): string[] => {
  const htmlFile = findFileByPath(files, htmlPath);
  if (!htmlFile || !htmlFile.content) return [];
  
  const { dependencies } = processHtmlForPreview(htmlFile.content, htmlPath, files);
  return dependencies;
};
