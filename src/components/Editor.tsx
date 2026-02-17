import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import './Editor.css';

interface EditorProps {
  value: string;
  language: string;
  fileId: string;
  onChange: (value: string | undefined) => void;
}

// Type for storing view state on model
interface ModelWithViewState extends monaco.editor.ITextModel {
  __viewState?: monaco.editor.ICodeEditorViewState;
}

// Type for monaco instance
interface MonacoInstance {
  editor: typeof monaco.editor;
  Uri: typeof monaco.Uri;
}

export function EditorComponent({ value, language, fileId, onChange }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map());
  const currentFileIdRef = useRef<string>(fileId);
  const monacoRef = useRef<MonacoInstance | null>(null);

  // Update ref when fileId changes
  useEffect(() => {
    currentFileIdRef.current = fileId;
  }, [fileId]);

  // Helper to get monaco instance
  const getMonaco = useCallback((): MonacoInstance | null => {
    return monacoRef.current;
  }, []);

  // Create or update model for a file
  const createOrUpdateModel = useCallback((id: string, content: string, lang: string) => {
    const monacoLib = getMonaco();
    if (!monacoLib) return null;

    const uri = monacoLib.Uri.parse(`file://${id}`);
    
    // Check if model already exists
    let model = monacoLib.editor.getModel(uri);
    
    if (!model) {
      // Create new model
      model = monacoLib.editor.createModel(content, lang, uri);
      modelsRef.current.set(id, model);
    } else {
      // Update existing model content if different
      if (model.getValue() !== content) {
        model.setValue(content);
      }
      // Update language if different
      if (model.getLanguageId() !== lang) {
        monacoLib.editor.setModelLanguage(model, lang);
      }
    }

    return model;
  }, [getMonaco]);

  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance as unknown as MonacoInstance;
    
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

    // Create model for current file if it doesn't exist
    createOrUpdateModel(fileId, value, language);
  }, [fileId, value, language, createOrUpdateModel]);

  // Handle file changes
  useEffect(() => {
    if (!editorRef.current) return;

    const monacoLib = getMonaco();
    if (!monacoLib) return;

    // Create or get model for new file
    const model = createOrUpdateModel(fileId, value, language);
    
    if (model && editorRef.current.getModel() !== model) {
      // Save current view state
      const oldFileId = currentFileIdRef.current;
      if (oldFileId && oldFileId !== fileId) {
        const oldState = editorRef.current.saveViewState();
        if (oldState) {
          const oldModel = modelsRef.current.get(oldFileId) as ModelWithViewState | undefined;
          if (oldModel) {
            oldModel.__viewState = oldState;
          }
        }
      }

      // Set new model
      editorRef.current.setModel(model);
      
      // Restore view state if exists
      const savedState = (model as ModelWithViewState).__viewState;
      if (savedState) {
        editorRef.current.restoreViewState(savedState);
      }
      
      editorRef.current.focus();
    }
  }, [fileId, createOrUpdateModel, getMonaco]);

  // Handle editor changes
  const handleChange = useCallback((newValue: string | undefined) => {
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="editor-wrapper">
      <div className="editor-header">
        <span className="editor-header-text">{language.toUpperCase()}</span>
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
          language={language}
          defaultValue={value}
          onChange={handleChange}
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
