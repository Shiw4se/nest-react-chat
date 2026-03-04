import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useChatSocket } from '../hooks/useChatSocket';
import { socket } from '../services/socket';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MessageBubble } from '../components/ui/MessageBubble';
import { ChatHeader } from './chat/components/ChatHeader';
import { TypingIndicator } from './chat/components/TypingIndicator';

export const ChatRoom: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const { messages, typingUsers, clearMessages } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, handleTyping } = useChatSocket(user);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleLeave = () => {
    socket.disconnect();
    clearMessages();
    logout();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
      <ChatHeader room={user.room} username={user.username} onLeave={handleLeave} />

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} isMe={msg.user.username === user.username} />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800 border-t border-slate-700 relative">
        <TypingIndicator users={typingUsers} />
        <form onSubmit={onSend} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!inputText.trim()} className="px-6 py-3">Send</Button>
        </form>
      </footer>
    </div>
  );
};