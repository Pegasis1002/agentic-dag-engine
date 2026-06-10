import React, { useState } from 'react';

const initialAgents = [
  { id: 'aegis', label: 'Aegis_Core_v1', status: 'running' },
  { id: 'sniffer', label: 'Network_Sniffer', status: 'offline' }
];

export default function AgentSidebar() {
  const [agents, setAgents] = useState(initialAgents);

  const toggleAgentStatus = (id) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id
          ? { ...agent, status: agent.status === 'running' ? 'offline' : 'running' }
          : agent
      )
    );
  };

  const getAgentStatusStyle = (status) => {
    switch(status) {
      case 'running': return 'bg-emerald-500 shadow-[0_0_8px_0_rgba(16,185,129,0.5)]';
      default: return 'bg-zinc-700';
    }
  };

  return (
    <div className="h-full border-r border-zinc-800 flex flex-col justify-between p-5 bg-zinc-950 min-w-0">
      {/* Top Section */}
      <div className="flex-1 w-full">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-4">Agents</h3>
        <div className="space-y-2">
          {agents.map(agent => (
            <div 
              key={agent.id}
              onClick={() => toggleAgentStatus(agent.id)}
              className="p-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm font-medium hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between gap-2 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getAgentStatusStyle(agent.status)}`}></span>
                <span className={`truncate text-zinc-200`}>
                  {agent.label}
                </span>
              </div>
              
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${
                agent.status === 'running' 
                  ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
                  : 'border-zinc-800 text-zinc-500 bg-zinc-900'
              }`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Settings Navigation Section (Forced to the bottom) */}
      <div className="flex flex-col gap-3.5 items-start pl-1 text-zinc-400 text-sm border-t border-zinc-900 pt-5 w-full shrink-0 bg-zinc-950">
        <button className="hover:text-zinc-100 transition-colors flex items-center gap-2.5 w-full text-left">
          <span>👤</span> Profile
        </button>
        <button className="hover:text-zinc-100 transition-colors flex items-center gap-2.5 w-full text-left">
          <span>❓</span> Help & Docs
        </button>
        <button className="hover:text-zinc-100 transition-colors flex items-center gap-2.5 w-full text-left">
          <span>⚙️</span> Settings
        </button>
      </div>
    </div>
  );
}