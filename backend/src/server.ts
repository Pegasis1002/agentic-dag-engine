import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { TaskNode } from '../../shared/tasknode';
import { generateTaskTree } from './planner';
import { runOrchestrator } from './orchestrator';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Standard Vite frontend port
        methods: ["GET", "POST"]
    }
});

interface AutomationSession {
    id: string;
    label: string;
    status: 'idle' | 'planning' | 'running' | 'completed' | 'failed';
    messages: Array<{ sender: 'AI' | 'you'; text: string; timestamp: string }>;
    tasks: TaskNode[];
}

// Stateful Multi-Session In-Memory Store
const sessions: Map<string, AutomationSession> = new Map([
    [
        'session_1',
        {
            id: 'session_1',
            label: 'Postgres DB Provisioner',
            status: 'idle',
            messages: [
                { sender: 'AI', text: 'Microsoft Entra ID authenticated. Aegis Core system online. Awaiting infrastructure automation directive.', timestamp: new Date().toLocaleTimeString() }
            ],
            tasks: []
        }
    ]
]);

io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Live Engine: ${socket.id}`);

    // 1. Send all available automation workspaces upon initial connection
    socket.emit('sessions_list', Array.from(sessions.values()));

    // 2. Handle creating a brand new isolated agent chat session
    socket.on('create_session', () => {
        const newId = `session_${Date.now()}`;
        const newSession: AutomationSession = {
            id: newId,
            label: `New System Workspace ${sessions.size + 1}`,
            status: 'idle',
            messages: [
                { sender: 'AI', text: 'New isolated instance initialized with Microsoft Entra permissions. Describe what tasks you would like to automate.', timestamp: new Date().toLocaleTimeString() }
            ],
            tasks: []
        };
        sessions.set(newId, newSession);
        io.emit('sessions_list', Array.from(sessions.values()));
        socket.emit('session_selected', newSession);
    });

    // 3. Handle selecting an active agent context
    socket.on('select_session', (sessionId: string) => {
        const session = sessions.get(sessionId);
        if (session) {
            socket.emit('session_selected', session);
        }
    });

    // 4. Process user command streams and map out structural plans automatically
    socket.on('user_prompt', async (data: { sessionId: string; prompt: string }) => {
        const { sessionId, prompt } = data;
        const session = sessions.get(sessionId);
        if (!session) return;

        // Append User Request to local record
        session.messages.push({ sender: 'you', text: prompt, timestamp: new Date().toLocaleTimeString() });
        session.status = 'planning';
        io.emit('sessions_list', Array.from(sessions.values()));
        socket.emit('session_selected', session);

        try {
            // Push textual description into the Microsoft Foundry Planner
            const draftedTasks = await generateTaskTree(prompt);
            
            // Enrich planned steps with structural requirements
            session.tasks = draftedTasks.map(t => ({
                ...t,
                status: t.status || 'pending',
                children: t.children || []
            }));

            session.status = 'idle';
            session.messages.push({ 
                sender: 'AI', 
                text: '🤖 I have formulated a sequential automation map for your directive. Please examine the Task Execution Tree panel. Click "Approve & Execute" to begin.', 
                timestamp: new Date().toLocaleTimeString() 
            });
        } catch (error: any) {
            session.status = 'failed';
            session.messages.push({ 
                sender: 'AI', 
                text: `❌ Failure generating automation model tree: ${error.message || error}`, 
                timestamp: new Date().toLocaleTimeString() 
            });
        }

        io.emit('sessions_list', Array.from(sessions.values()));
        socket.emit('session_selected', session);
    });

    // 5. Save customized client scheduling changes (reordering/additions)
    socket.on('update_tasks', (data: { sessionId: string; tasks: TaskNode[] }) => {
        const session = sessions.get(data.sessionId);
        if (session && session.status !== 'running') {
            session.tasks = data.tasks;
            socket.emit('session_selected', session);
        }
    });

    // 6. Approve and run the operational pipeline through the Orchestrator
    socket.on('approve_plan', async (data: { sessionId: string }) => {
        const session = sessions.get(data.sessionId);
        if (!session || session.tasks.length === 0 || session.status === 'running') return;

        session.status = 'running';
        session.messages.push({ sender: 'AI', text: '🚀 Pipeline approved! Initializing execution loop...', timestamp: new Date().toLocaleTimeString() });
        io.emit('sessions_list', Array.from(sessions.values()));
        socket.emit('session_selected', session);

        // Async non-blocking loop handling real-time updates back to the UI
        runOrchestrator(session.tasks, (updatedTasks) => {
            session.tasks = [...updatedTasks];
            socket.emit('task_update', { sessionId: session.id, tasks: session.tasks });
            socket.emit('session_selected', session);
        }).then((finalTree) => {
            const hasFailures = finalTree.some(t => t.status === 'failed');
            session.status = hasFailures ? 'failed' : 'completed';
            session.messages.push({
                sender: 'AI',
                text: hasFailures ? '❌ Pipeline halted due to task execution failure.' : '🏁 All automation tasks successfully executed across targeted enterprise systems!',
                timestamp: new Date().toLocaleTimeString()
            });
            io.emit('sessions_list', Array.from(sessions.values()));
            socket.emit('session_selected', session);
        }).catch((err) => {
            session.status = 'failed';
            io.emit('sessions_list', Array.from(sessions.values()));
        });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client cut loose: ${socket.id}`);
    });
});

const PORT = 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Agentic DAG Engine backend spinning on http://localhost:${PORT}`);
});
