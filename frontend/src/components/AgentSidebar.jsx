import React from 'react';

export default function AgentSidebar({ sessions, activeSessionId, onSelectSession, onCreateSession }) {
  return (
    <div className="h-full border-r border-zinc-800 flex flex-col justify-between p-5 bg-zinc-950 min-w-0">
      <div className="flex-1 w-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Workspaces</h3>
          <button 
            onClick={onCreateSession}
            className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2 py-1 rounded hover:bg-cyan-900/50 transition-all cursor-pointer"
          >
            + New
          </button>
        </div>

        <div className="space-y-2">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`p-3 rounded-md border text-sm font-medium transition-all cursor-pointer flex items-center justify-between gap-2 min-w-0 ${
                session.id === activeSessionId
                  ? 'bg-zinc-900 border-zinc-600 text-zinc-100 shadow-sm'
                  : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  session.status === 'running' ? 'bg-amber-500 animate-pulse' :
                  session.status === 'completed' ? 'bg-emerald-500' :
                  session.status === 'failed' ? 'bg-rose-500' : 'bg-zinc-600'
                }`}></span>
                <span className="truncate">{session.label}</span>
              </div>
              <span className="text-[9px] font-mono uppercase shrink-0 px-1 py-0.5 rounded bg-zinc-950 text-zinc-500 border border-zinc-800">
                {session.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Corporate Entra ID Guard Profile Section */}
      <div className="flex flex-col gap-3 items-start pl-1 text-zinc-400 text-sm border-t border-zinc-900 pt-5 w-full shrink-0 bg-zinc-950">
        <div className="flex items-center gap-2.5 w-full bg-zinc-900/50 p-2 rounded.md border border-zinc-900 mb-2">
          <div className="h-7 w-7 rounded-full bg-cyan-900 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 border border-cyan-800">
            ID
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate">Disciple Prodigy</span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span> Entra Verified
            </span>
          </div>
        </div>
        <button className="hover:text-zinc-100 transition-colors flex items-center gap-2.5 w-full text-left cursor-pointer">
          <span>❓</span> Documentation
        </button>
        <button className="hover:text-zinc-100 transition-colors flex items-center gap-2.5 w-full text-left cursor-pointer">
          <span>⚙️</span> Enterprise Config
        </button>
      </div>
    </div>
  );
}
