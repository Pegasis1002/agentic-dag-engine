import React from 'react';

export default function TaskScheduler({ session, onUpdateTasks }) {
  if (!session) {
    return (
      <div className="h-full border-l border-zinc-800 bg-zinc-950 p-5 flex items-center justify-center text-xs text-zinc-600 font-mono">
        Awaiting workspace binding...
      </div>
    );
  }

  const { tasks = [], status: sessionStatus } = session;

  const moveTask = (index, direction) => {
    if (sessionStatus === 'running') return; // Enforce lock rules
    const updatedTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updatedTasks.length) return;

    const temp = updatedTasks[index];
    updatedTasks[index] = updatedTasks[targetIndex];
    updatedTasks[targetIndex] = temp;
    onUpdateTasks(updatedTasks);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'running': return 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse';
      case 'failed': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-500';
    }
  };

  return (
    <div className="h-full border-l border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between min-w-0 w-full font-sans">
      <div className="w-full flex-1 overflow-y-auto pr-1">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-4">Task Execution Tree</h3>
        
        {tasks.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center text-zinc-600 text-xs">
            No active plan. Prompt your automation agent to map out technical steps.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div key={task.id || index} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-3.5 shadow-sm">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-medium text-zinc-200 truncate">{task.label}</span>
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0 ${getStatusStyle(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  {sessionStatus !== 'running' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        disabled={index === 0}
                        onClick={() => moveTask(index, 'up')}
                        className="p-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 cursor-pointer"
                      >
                        ▲
                      </button>
                      <button 
                        disabled={index === tasks.length - 1}
                        onClick={() => moveTask(index, 'down')}
                        className="p-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20 cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
                {task.instruction && (
                  <p className="text-[11px] font-mono text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {task.instruction}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-5 pt-4 border-t border-zinc-900 w-full shrink-0 bg-zinc-950">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Live Session DAG Output</span>
        <pre className="text-[11px] font-mono text-cyan-500 bg-zinc-900/40 border border-zinc-800 p-3 rounded-md overflow-x-auto max-h-40">
          {JSON.stringify({ sessionId: session.id, planStatus: sessionStatus, taskTree: tasks }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
