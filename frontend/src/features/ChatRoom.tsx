import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { socket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage } from '../types/chat';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MessageBubble } from '../components/ui/MessageBubble';

export const ChatRoom: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const typingUsers = useChatStore((state) => state.typingUsers);
  const setTyping = useChatStore((state) => state.setTyping);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    socket.auth = { token: localStorage.getItem('token') };
    socket.connect();

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/messages/${user.room}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();

    socket.emit('join', { room: user.room, username: user.username });

    socket.on('newMessage', (message: ChatMessage) => {
      addMessage(message);
    });

    socket.on('userTyping', ({ username, isTyping }) => {
      setTyping(username, isTyping);
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
    };
  }, [user, setMessages, addMessage, setTyping]);

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!user) return;

    socket.emit('typing', { room: user.room, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: user.room, isTyping: false });
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    socket.emit('SendMessage', {
      room: user.room,
      message: inputText,
    });

    socket.emit('typing', { room: user.room, isTyping: false });
    setInputText('');
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    clearMessages();
    logout();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Room: <span className="text-blue-400">{user.room}</span></h2>
          <p className="text-sm text-slate-400">Logged in as {user.username}</p>
        </div>
        <Button onClick={handleLeaveRoom} variant="danger">
          Leave
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble 
              key={index} 
              message={msg} 
              isMe={msg.user.username === user.username} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800 border-t border-slate-700 relative">
        {typingUsers.length > 0 && (
          <div className="absolute -top-6 left-4 text-xs text-slate-400 italic transition-opacity duration-300">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            type="text"
            value={inputText}
            onChange={handleTypingChange}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!inputText.trim()} className="px-6 py-3">
            Send
          </Button>
        </form>
      </footer>
    </div>
  );
};