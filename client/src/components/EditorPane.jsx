import Editor from "@monaco-editor/react";

export function EditorPane({ code, language, onCodeChange }) {
  return (
    <Editor
      height="70vh"
      language={language}
      value={code}
      theme="vs-dark"
      options={{ fontSize: 14, minimap: { enabled: false } }}
      onChange={(value) => onCodeChange(value || "")}
    />
  );
}
