import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AgentSidebar from './components/AgentSidebar';
import ChatInterface from './components/ChatInterface';
import TaskScheduler from './components/TaskScheduler';

// Task Tree Core Data Structure (v0.1.0)
const initialDagTasks = [
  { "id": "1", "label": "Setup DB", "status": "completed", "children": [
    { "id": "1.1", "label": "Provision Postgres", "status": "completed" },
    { "id": "1.2", "label": "Run Migrations", "status": "completed" }
  ]},
  { "id": "2", "label": "Configure Firewall", "status": "running", "children": [
    { "id": "2.1", "label": "Block Port 80", "status": "pending" },
    { "id": "2.2", "label": "Open Port 443", "status": "running" }
  ]},
  { "id": "3", "label": "Deploy Engine Core", "status": "pending", "children": [] }
];

const BACKEND_WS_URL = 'http://localhost:5000';

export default function App() {
  const [tasks, setTasks] = useState(initialDagTasks);
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Agentic DAG Engine systems online. Awaiting system infrastructure directives.', timestamp: new Date().toLocaleTimeString() }
  ]);
  const socketRef = useRef(null);

  // Live WebSocket Engine Listener Channel
  useEffect(() => {
    console.log('🔗 Connecting to WebSocket backend at:', BACKEND_WS_URL);
    socketRef.current = io(BACKEND_WS_URL);

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server.');
    });

    socketRef.current.on('task_update', (updatedTaskData) => {
      console.log('⚡ Live dynamic DAG state received:', updatedTaskData);
      setTasks(prevTasks => mergeUpdatedTask(prevTasks, updatedTaskData));
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection.');
      socketRef.current.disconnect();
    };
  }, []);

  // Structural Up/Down Task Sorting Command Modifier
  const moveTask = (index, direction) => {
    const updatedTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updatedTasks.length) return;

    const temp = updatedTasks[index];
    updatedTasks[index] = updatedTasks[targetIndex];
    updatedTasks[targetIndex] = temp;
    setTasks(updatedTasks);
  };

  // Dispatch message prompts straight into the live socket server channel
  const handleSendPrompt = (text) => {
    const userMessage = { sender: 'you', text: text, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMessage]);

    if (socketRef.current && socketRef.current.connected) {
      console.log('To Backend -> user_prompt:', text);
      socketRef.current.emit('user_prompt', { prompt: text, agentId: 'core_engine' });
    } else {
      console.warn('⚠️ WebSocket disconnected. Frame cached locally.');
    }
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex overflow-hidden antialiased font-sans select-none">
      {/* Column 1: Left Panel Sidebar */}
      <div className="w-64 h-full flex-shrink-0">
        <AgentSidebar />
      </div>
      
      {/* Column 2: Central Fluid Main Chat Room */}
      <div className="flex-1 h-full border-r border-zinc-800">
        <ChatInterface messages={messages} onSendPrompt={handleSendPrompt} />
      </div>
      
      {/* Column 3: Right Panel Tree Scheduler */}
      <div className="w-96 h-full flex-shrink-0">
        <TaskScheduler tasks={tasks} moveTask={moveTask} />
      </div>
    </div>
  );
}

// Deep state array mapping tool for live server merging
function mergeUpdatedTask(tasks, updatedTask) {
  return tasks.map(task => {
    if (task.id === updatedTask.id) {
      return { ...task, ...updatedTask };
    } else if (task.children) {
      return { ...task, children: mergeUpdatedTask(task.children, updatedTask) };
    }
    return task;
  });
}