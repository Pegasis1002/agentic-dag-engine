import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AgentSidebar from './components/AgentSidebar';
import ChatInterface from './components/ChatInterface';
import TaskScheduler from './components/TaskScheduler';

const BACKEND_WS_URL = 'http://localhost:5000';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_WS_URL);

    socketRef.current.on('sessions_list', (list) => {
      setSessions(list);
      // Auto-focus the current session to ensure seamless transitions
      if (!activeSession && list.length > 0) {
        socketRef.current.emit('select_session', list[0].id);
      }
    });

    socketRef.current.on('session_selected', (session) => {
      setActiveSession(session);
    });

    socketRef.current.on('task_update', (data) => {
      if (activeSession && activeSession.id === data.sessionId) {
        setActiveSession(prev => ({ ...prev, tasks: data.tasks }));
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [activeSession]);

  const handleSelectSession = (id) => {
    socketRef.current.emit('select_session', id);
  };

  const handleCreateSession = () => {
    socketRef.current.emit('create_session');
  };

  const handleSendPrompt = (text) => {
    if (!activeSession) return;
    socketRef.current.emit('user_prompt', { sessionId: activeSession.id, prompt: text });
  };

  const handleApprovePlan = () => {
    if (!activeSession) return;
    socketRef.current.emit('approve_plan', { sessionId: activeSession.id });
  };

  const handleUpdateTasks = (updatedTasks) => {
    if (!activeSession) return;
    setActiveSession(prev => ({ ...prev, tasks: updatedTasks }));
    socketRef.current.emit('update_tasks', { sessionId: activeSession.id, tasks: updatedTasks });
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex overflow-hidden antialiased font-sans select-none">
      {/* Panel 1: Left Navigation History / Agent Instantiation */}
      <div className="w-64 h-full flex-shrink-0">
        <AgentSidebar 
          sessions={sessions} 
          activeSessionId={activeSession?.id} 
          onSelectSession={handleSelectSession} 
          onCreateSession={handleCreateSession}
        />
      </div>
      
      {/* Panel 2: Central Active Conversation Stream */}
      <div className="flex-1 h-full border-r border-zinc-800">
        <ChatInterface 
          session={activeSession} 
          onSendPrompt={handleSendPrompt} 
          onApprovePlan={handleApprovePlan}
        />
      </div>
      
      {/* Panel 3: Right Dynamic Interactive Scheduler */}
      <div className="w-96 h-full flex-shrink-0">
        <TaskScheduler 
          session={activeSession} 
          onUpdateTasks={handleUpdateTasks}
        />
      </div>
    </div>
  );
}
