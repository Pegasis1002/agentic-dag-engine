// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AgentSidebar from './components/AgentSidebar';
import ChatInterface from './components/ChatInterface';
import TaskScheduler from './components/TaskScheduler';

const BACKEND_WS_URL = 'http://localhost:5000';

// 🌟 THE FOOLPROOF FIX: Instantiate the socket completely OUTSIDE the component!
// This way, React Strict Mode and Vite HMR cannot destroy the connection during re-renders.
const socket = io(BACKEND_WS_URL);

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // We still use a ref for the active session to avoid stale closures in listeners
  const activeSessionRef = useRef(activeSession);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    // 🌟 We define the listener functions explicitly so we can remove them later
    const onSessionsList = (list) => {
      setSessions(list);
      if (!activeSessionRef.current && list.length > 0) {
        socket.emit('select_session', list[0].id);
      }
    };

    const onSessionSelected = (session) => {
      setActiveSession(session);
    };

    const onTaskUpdate = (data) => {
      if (activeSessionRef.current && activeSessionRef.current.id === data.sessionId) {
        setActiveSession((prev) => ({ ...prev, tasks: data.tasks }));
      }
    };

    // Attach listeners
    socket.on('sessions_list', onSessionsList);
    socket.on('session_selected', onSessionSelected);
    socket.on('task_update', onTaskUpdate);

    return () => {
      // 🌟 CLEANUP FIX: Only remove the event listeners! 
      // DO NOT call socket.disconnect() here! Let the socket live!
      socket.off('sessions_list', onSessionsList);
      socket.off('session_selected', onSessionSelected);
      socket.off('task_update', onTaskUpdate);
    };
  }, []); // <--- Empty dependency array!

  const handleSelectSession = (id) => {
    socket.emit('select_session', id);
  };

  const handleCreateSession = () => {
    socket.emit('create_session');
  };

  const handleSendPrompt = (text) => {
    if (!activeSession) return;
    socket.emit('user_prompt', { sessionId: activeSession.id, prompt: text });
  };

  const handleApprovePlan = () => {
    if (!activeSession) return;
    socket.emit('approve_plan', { sessionId: activeSession.id });
  };

  const handleUpdateTasks = (updatedTasks) => {
    if (!activeSession) return;
    setActiveSession((prev) => ({ ...prev, tasks: updatedTasks }));
    socket.emit('update_tasks', { sessionId: activeSession.id, tasks: updatedTasks });
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex overflow-hidden antialiased font-sans select-none">
      <div className="w-64 h-full flex-shrink-0">
        <AgentSidebar 
          sessions={sessions} 
          activeSessionId={activeSession?.id} 
          onSelectSession={handleSelectSession} 
          onCreateSession={handleCreateSession}
        />
      </div>
      
      <div className="flex-1 h-full border-r border-zinc-800">
        <ChatInterface 
          session={activeSession} 
          onSendPrompt={handleSendPrompt} 
          onApprovePlan={handleApprovePlan}
        />
      </div>
      
      <div className="w-96 h-full flex-shrink-0">
        <TaskScheduler 
          session={activeSession} 
          onUpdateTasks={handleUpdateTasks}
        />
      </div>
    </div>
  );
}
