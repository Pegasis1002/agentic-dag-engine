import React, { useState } from 'react';

export default function ChatInterface({ session, onSendPrompt, onApprovePlan }) {
  const [input, setInput] = useState('');

  if (!session) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-zinc-900/10 text-zinc-500 font-sans">
        <p className="text-sm tracking-wide">Select or initialize a system workspace to display the active conversation stream.</p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || session.status === 'running') return;
    onSendPrompt(input);
    setInput('');
  };

  const isPlanAwaitingApproval = session.tasks && session.tasks.length > 0 && session.status === 'idle';

  return (
    <div className="flex flex-col h-full bg-zinc-900/20 font-sans min-w-0">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-zinc-200">{session.label}</span>
          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 capitalize ${
            session.status === 'running' ? 'text-amber-400 bg-amber-950/30' : 'text-zinc-400 bg-zinc-900'
          }`}>{session.status} Stream</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="w-full space-y-6">
          {session.messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'} w-full`}
            >
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1.5">
                {msg.sender === 'you' ? 'Prodigy Operator' : 'Agentic Orchestration Engine'}
              </span>
              <div className={`p-3.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.sender === 'you' 
                  ? 'bg-zinc-100 text-zinc-900 font-normal ml-auto max-w-[85%]' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 mr-auto max-w-[85%]'
              }`}>
                {msg.text}
              </div>
              {msg.timestamp && <span className="text-[9px] text-zinc-600 mt-1 font-mono">{msg.timestamp}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Plan Approval Container Box */}
      {isPlanAwaitingApproval && (
        <div className="mx-4 mb-2 p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl flex items-center justify-between gap-4 shrink-0 animate-fade-in">
          <div className="text-xs text-cyan-300">
            <span className="font-bold uppercase tracking-wider block mb-0.5">Pipeline Proposed</span>
            Review the {session.tasks.length} automation tasks. You can adjust the steps or sequence in the right panel before launching.
          </div>
          <button
            onClick={onApprovePlan}
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
          >
            Approve & Execute Plan ➔
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="w-full relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus-within:border-zinc-700 transition-all">
          <input 
            type="text" 
            disabled={session.status === 'running'}
            placeholder={session.status === 'running' ? "Orchestration currently executing..." : "Instruct system automation..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-zinc-100 placeholder-zinc-500 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={session.status === 'running'}
            className="text-cyan-400 hover:text-cyan-300 ml-2 disabled:opacity-30 cursor-pointer"
          >
            ➔
          </button>
        </div>
      </form>
    </div>
  );
}
