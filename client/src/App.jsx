import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api/client";
import { EditorPane } from "./components/EditorPane";
import { UsersList } from "./components/UsersList";
import { VersionHistory } from "./components/VersionHistory";
import { ProblemPanel } from "./components/ProblemPanel";

const roomId = new URLSearchParams(window.location.search).get("room") || "demo-room";
const username = new URLSearchParams(window.location.search).get("user") || `dev-${Math.floor(Math.random() * 999)}`;

export function App() {
  const [code, setCode] = useState("// Loading session...");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");

  const pendingSyncRef = useRef();

  const socket = useMemo(
    () =>
      io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 2500,
        timeout: 10000
      }),
    []
  );

  useEffect(() => {
    api
      .get(`/sessions/${roomId}`)
      .then(({ data }) => {
        setCode(data.code);
        setLanguage(data.language);
        setVersions(data.versions || []);
        setActiveProblem(data.activeProblem || null);
      })
      .catch(() => setError("Failed to load session"));

    const joinRoom = () => {
      socket.emit("join_room", { roomId, username }, (response) => {
        if (!response?.ok) {
          setError(response?.error || "Unable to join room");
        } else {
          setError("");
        }
      });
    };

    socket.on("connect", () => {
      setStatus("connected");
      joinRoom();
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", (err) => {
      setStatus("disconnected");
      setError(`Socket connection failed: ${err.message}`);
    });
    socket.on("server_error", ({ message }) => setError(message));

    socket.connect();

    socket.on("code_update", ({ code: nextCode, language: nextLanguage }) => {
      setCode(nextCode);
      setLanguage(nextLanguage);
    });

    socket.on("presence", setUsers);

    return () => {
      clearTimeout(pendingSyncRef.current);
      socket.disconnect();
    };
  }, [socket]);

  const emitChange = (nextCode, nextLanguage = language) => {
    socket.emit("code_change", { roomId, code: nextCode, language: nextLanguage });
  };

  const pushChange = (nextCode) => {
    setCode(nextCode);
    clearTimeout(pendingSyncRef.current);
    pendingSyncRef.current = setTimeout(() => emitChange(nextCode), 60);
  };

  const saveVersion = async () => {
    const { data } = await api.post(`/sessions/${roomId}/version`, { code, language, savedBy: username });
    setVersions(data.versions);
  };

  const askAi = async () => {
    const { data } = await api.post(`/sessions/${roomId}/ai-complete`, { code, language });
    const combined = `${code}\n${data.completion}`;
    setCode(combined);
    emitChange(combined);
  };

  const shareProblem = async (problem) => {
    const { data } = await api.post(`/sessions/${roomId}/problem`, problem);
    setActiveProblem(data.activeProblem);
  };

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    emitChange(code, nextLanguage);
  };

  return (
    <main className="layout">
      <section className="editor-area">
        <header>
          <h1>RT IDE · room: {roomId}</h1>
          <div className="toolbar">
            <span className={`badge ${status}`}>{status}</span>
            <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
            <button onClick={saveVersion}>Save Version</button>
            <button onClick={askAi}>AI Complete</button>
          </div>
        </header>
        {error ? <p className="error">{error}</p> : null}
        <EditorPane code={code} language={language} onCodeChange={pushChange} />
      </section>
      <aside className="sidebar">
        <UsersList users={users} />
        <VersionHistory versions={versions} onRestore={pushChange} />
        <ProblemPanel onShare={shareProblem} activeProblem={activeProblem} />
      </aside>
    </main>
  );
}
