import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import Editor, { Monaco } from '@monaco-editor/react';
import { OpenFile } from '../App';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TabBar = styled.div`
  display: flex;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  overflow-x: auto;
`;

const Tab = styled.div<{ isActive: boolean; isDirty: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: ${props => props.isActive ? '#1e1e1e' : '#2d2d30'};
  border-right: 1px solid #3e3e42;
  cursor: pointer;
  min-width: 120px;
  position: relative;

  &:hover {
    background-color: ${props => props.isActive ? '#1e1e1e' : '#37373d'};
  }

  ${props => props.isDirty && `
    &::after {
      content: '●';
      color: #ffffff;
      margin-left: 4px;
    }
  `}
`;

const TabName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 2px 4px;
  margin-left: 4px;
  border-radius: 2px;
  
  &:hover {
    background-color: #3e3e42;
  }
`;

const EditorWrapper = styled.div`
  flex: 1;
  position: relative;
`;

interface CodeEditorProps {
  files: OpenFile[];
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  onFileClose: (filePath: string) => void;
  onContentChange: (filePath: string, content: string) => void;
  onCursorPositionChange: (filePath: string, position: { line: number; column: number }) => void;
  onInlineCompletionRequest: (
    code: string,
    position: { line: number; column: number },
    language: string
  ) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileClose,
  onContentChange,
  onCursorPositionChange,
  onInlineCompletionRequest
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [completionTimeout, setCompletionTimeout] = useState<NodeJS.Timeout | null>(null);

  const activeFileData = activeFile ? files.find(f => f.path === activeFile) : null;

  useEffect(() => {
    // Configure Monaco editor when it's ready
    if (monacoRef.current && editorRef.current) {
      configureMonaco();
    }
  }, [monacoRef.current, editorRef.current]);

  const configureMonaco = () => {
    if (!monacoRef.current) return;

    const monaco = monacoRef.current;

    // Configure Apex language support
    monaco.languages.register({ id: 'apex' });
    monaco.languages.setMonarchTokensProvider('apex', {
      tokenizer: {
        root: [
          [/\b(public|private|protected|global|static|final|abstract|virtual|override)\b/, 'keyword'],
          [/\b(class|interface|enum|extends|implements|trigger)\b/, 'keyword'],
          [/\b(if|else|for|while|do|switch|case|default|break|continue|return)\b/, 'keyword'],
          [/\b(try|catch|finally|throw|throws)\b/, 'keyword'],
          [/\b(new|this|super|null|true|false)\b/, 'keyword'],
          [/\b(String|Integer|Boolean|Decimal|Date|DateTime|List|Set|Map|SObject)\b/, 'type'],
          [/\b(System|Database|Schema|Test|ApexPages|UserInfo)\b/, 'type'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/"/, 'string', '@pop']
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Configure SOQL language support
    monaco.languages.register({ id: 'soql' });
    monaco.languages.setMonarchTokensProvider('soql', {
      tokenizer: {
        root: [
          [/\b(SELECT|FROM|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET)\b/i, 'keyword'],
          [/\b(AND|OR|NOT|IN|LIKE|NULL|ASC|DESC)\b/i, 'keyword'],
          [/\b(COUNT|SUM|AVG|MIN|MAX|FIRST|LAST)\b/i, 'keyword'],
          [/\b(TODAY|YESTERDAY|TOMORROW|THIS_WEEK|LAST_WEEK|NEXT_WEEK)\b/i, 'keyword'],
          [/'([^'\\]|\\.)*'/, 'string'],
          [/\d+/, 'number'],
          [/[a-zA-Z_][a-zA-Z0-9_]*__c/, 'type'], // Custom fields
          [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
        ]
      }
    });

    // Set up themes
    monaco.editor.defineTheme('ai-ide-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#ffffff',
      }
    });

    monaco.editor.setTheme('ai-ide-dark');
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    configureMonaco();

    // Set up event listeners
    editor.onDidChangeCursorPosition((e: any) => {
      if (activeFile) {
        const position = {
          line: e.position.lineNumber,
          column: e.position.column
        };
        onCursorPositionChange(activeFile, position);
      }
    });

    // Set up inline completion trigger
    editor.onDidChangeModelContent((e: any) => {
      if (activeFile && activeFileData) {
        // Clear existing timeout
        if (completionTimeout) {
          clearTimeout(completionTimeout);
        }

        // Set new timeout for inline completion
        const timeout = setTimeout(() => {
          const position = editor.getPosition();
          if (position) {
            const model = editor.getModel();
            const code = model.getValue();
            
            onInlineCompletionRequest(code, {
              line: position.lineNumber,
              column: position.column
            }, activeFileData.language);
          }
        }, 500); // 500ms delay

        setCompletionTimeout(timeout);
      }
    });

    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save is handled by menu
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
      // Toggle chat is handled by menu
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      onContentChange(activeFile, value);
    }
  };

  return (
    <EditorContainer>
      <TabBar>
        {files.map(file => (
          <Tab
            key={file.path}
            isActive={file.path === activeFile}
            isDirty={file.isDirty}
            onClick={() => onFileSelect(file.path)}
          >
            <TabName title={file.path}>{file.name}</TabName>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(file.path);
              }}
            >
              ×
            </CloseButton>
          </Tab>
        ))}
      </TabBar>

      <EditorWrapper>
        {activeFileData ? (
          <Editor
            height="100%"
            language={activeFileData.language}
            value={activeFileData.content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              theme: 'ai-ide-dark',
              fontSize: 14,
              lineNumbers: 'on',
              minimap: { enabled: true },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false
              }
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#6f6f6f',
            fontSize: '16px'
          }}>
            Open a file to start coding
          </div>
        )}
      </EditorWrapper>
    </EditorContainer>
  );
};
