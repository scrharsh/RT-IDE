export function VersionHistory({ versions, onRestore }) {
  return (
    <div className="panel">
      <h3>Version history</h3>
      <div className="versions">
        {versions.slice().reverse().map((v, idx) => (
          <button key={`${v.savedAt}-${idx}`} onClick={() => onRestore(v.code)}>
            {new Date(v.savedAt).toLocaleTimeString()} · {v.savedBy || "user"}
          </button>
        ))}
      </div>
    </div>
  );
}
