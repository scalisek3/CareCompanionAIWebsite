import React, { useState } from 'react';
import axios from 'axios';

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content:
        'You are CareCompanionAI, a friendly and helpful assistant designed to support seniors in California. You specialize in United Healthcare, Medicare, Medicaid, and palliative care. Be Proactive, and respond clearly, with empathy, and give concise, useful answers.'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { messages: newMessages });
      const assistantMessage = res.data.choices[0].message;
      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Bot' : 'System'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default GPTChatBot;
