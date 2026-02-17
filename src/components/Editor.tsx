import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import './Editor.css';

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

export function EditorComponent({ value, onChange }: EditorProps) {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
    
    // Set editor options
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      theme: 'vs-dark',
    });
  }

  return (
    <div className="editor-wrapper">
      <div className="editor-header">
        <span className="editor-header-text">HTML</span>
        <div className="editor-actions">
          <button className="editor-action-btn" title="Format Document">
            ✨
          </button>
          <button className="editor-action-btn" title="Copy">
            📋
          </button>
        </div>
      </div>
      <div className="editor-content">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="editor-loading">
              <div className="loading-spinner" />
              <span>Loading Editor...</span>
            </div>
          }
          options={{
            minimap: { enabled: true, scale: 1 },
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    </div>
  );
}

export { EditorComponent as Editor };
