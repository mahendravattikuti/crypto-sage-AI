import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole } from '../types';
import { User, Bot, BrainCircuit, ExternalLink } from 'lucide-react';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3 rounded-2xl shadow-lg ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
          }`}>
            
            {/* Thinking Indicator (if this message was generated with thinking) */}
            {message.isThinking && !isUser && (
              <div className="flex items-center gap-2 mb-2 text-xs text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded w-fit border border-emerald-900/50">
                <BrainCircuit size={12} />
                <span className="font-medium">Deep Thought Analysis</span>
              </div>
            )}

            {/* Attached Image */}
            {message.image && (
              <div className="mb-3 mt-1">
                <img 
                  src={message.image} 
                  alt="User upload" 
                  className="max-w-full h-auto max-h-60 rounded-lg border border-slate-600 object-cover" 
                />
              </div>
            )}

            {/* Text Content */}
            <div className={`prose prose-invert prose-sm max-w-none ${isUser ? 'text-white' : 'text-slate-200'}`}>
              <ReactMarkdown 
                components={{
                    a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />,
                    strong: ({node, ...props}) => <strong {...props} className="text-emerald-400 font-bold" />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sources / Footnotes */}
          {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-slate-700 transition-colors"
                >
                  <ExternalLink size={10} />
                  <span className="truncate max-w-[150px]">{source.title}</span>
                </a>
              ))}
            </div>
          )}
          
          <span className="text-[10px] text-slate-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  );
};
