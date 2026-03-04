import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { socket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage } from '../types/chat';

export const ChatRoom: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch history and handle socket subscriptions
  useEffect(() => {
    if (!user) return;

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

    // Join the specific room
    socket.emit('join', { room: user.room, username: user.username });

    // Listen for incoming messages
    socket.on('newMessage', (message: ChatMessage) => {
      addMessage(message);
    });

    return () => {
      socket.off('newMessage');
    };
  }, [user, setMessages, addMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    socket.emit('SendMessage', {
      room: user.room,
      message: inputText,
    });

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
        <button 
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-slate-700 hover:bg-red-500/80 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Leave
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user.username === user.username;
            return (
              <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-400 mb-1 ml-1">{msg.user.username}</span>
                <div 
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-slate-700 text-slate-100 rounded-tl-sm'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500 transition-all"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all active:scale-95"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
};