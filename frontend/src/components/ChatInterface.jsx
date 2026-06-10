import React, { useState } from 'react';

export default function ChatInterface({ messages = [], onSendPrompt }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendPrompt(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/20 font-sans min-w-0">
      {/* Top Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-zinc-200">Chat Stream</span>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Live Engine</span>
        </div>
      </div>

      {/* 🌟 THE REAL FIX: Removed 'max-w-4xl mx-auto'. Now uses w-full so text elements utilize 100% of the column width */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="w-full space-y-6">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'} w-full`}
            >
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase mb-1.5">
                {msg.sender === 'you' ? 'You' : 'Agentic Engine'}
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

      {/* Input Bar stretching fully to match the edges */}
      <form onSubmit={handleSubmit} className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
        <div className="w-full relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
          <button type="button" className="text-zinc-500 hover:text-zinc-300 mr-2.5 text-lg font-light">+</button>
          <input 
            type="text" 
            placeholder="Instruct system architecture..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-zinc-100 placeholder-zinc-500"
          />
          <button type="submit" className="text-cyan-400 hover:text-cyan-300 ml-2">➔</button>
        </div>
      </form>
    </div>
  );
}