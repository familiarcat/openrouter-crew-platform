import React, { useState, useEffect, useRef } from 'react';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

// Acquire VS Code API
const vscode = (window as any).acquireVsCodeApi();

export interface Message {
    role: 'user' | 'assistant' | 'system';
    text: string;
    meta?: {
        model: string;
        cost: number;
        time: number;
    };
}

export default function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle messages sent from the extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'addMessage':
                    setMessages(prev => [...prev, { 
                        role: message.role, 
                        text: message.text,
                        meta: message.meta 
                    }]);
                    break;
                case 'clear':
                    setMessages([]);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (text: string) => {
        // Optimistically add user message
        setMessages(prev => [...prev, { role: 'user', text }]);
        // Send to extension
        vscode.postMessage({ command: 'ask', text });
    };

    return (
        <div className="chat-container">
            <div className="messages">
                <MessageList messages={messages} />
                <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} />
        </div>
    );
}