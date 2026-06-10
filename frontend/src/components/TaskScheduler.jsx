import React from 'react';

export default function TaskScheduler({ tasks, moveTask }) {
  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'running': return 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="h-full border-l border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between min-w-0 w-full">
      
      {/* Top List Wrapper */}
      <div className="w-full flex-1 overflow-y-auto pr-1">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-4">Task Execution Tree</h3>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.id} className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-3.5">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-200 truncate">{task.label}</span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border shrink-0 ${getStatusStyle(task.status)}`}>
                    {task.status}
                </span>
                </div>
                
                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    disabled={index === 0}
                    onClick={() => moveTask(index, 'up')}
                    className="p-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button 
                    disabled={index === tasks.length - 1}
                    onClick={() => moveTask(index, 'down')}
                    className="p-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {task.children && task.children.length > 0 && (
                <div className="ml-1 mt-3 pl-2.5 border-l border-zinc-800 space-y-2">
                  {task.children.map((child) => (
                    <div key={child.id} className="text-xs flex items-center justify-between gap-2 text-zinc-400 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="text-zinc-700 font-mono">├─</span>
                        <span className="truncate">{child.label}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0 ${getStatusStyle(child.status)}`}>
                        {child.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Dynamic JSON logger sitting neatly at the baseline */}
      <div className="mt-5 pt-4 border-t border-zinc-900 w-full shrink-0 bg-zinc-950">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Live DAG State JSON</span>
        <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 border border-zinc-800 p-3 rounded-md overflow-x-auto max-h-40">
          {JSON.stringify(tasks, null, 2)}
        </pre>
      </div>

    </div>
  );
}