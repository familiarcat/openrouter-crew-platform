import React from 'react';
import { Message } from '../App';

interface MessageListProps {
    messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
    return (
        <>
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                    <div className="role">{msg.role === 'user' ? 'You' : 'Crew Agent'}</div>
                    <div className="content">{msg.text}</div>
                    {msg.meta && (
                        <div className="meta">
                            <span>{msg.meta.model}</span>
                            <span>${msg.meta.cost.toFixed(6)}</span>
                            <span>{msg.meta.time}ms</span>
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}