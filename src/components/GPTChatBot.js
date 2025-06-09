import React, { useState } from 'react';
import axios from 'axios';

const extractLocation = (text) => {
  const locationRegex = /\b(in|near|around|from|to) ([A-Z][a-z]+(?:,?\s?[A-Z]{2})?)\b/;
  const match = text.match(locationRegex);
  return match ? match[2] : null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content:
        'You are CareCompanionAI, a warm, empathetic assistant who helps seniors in California navigate UnitedHealthcare, Medicare, Medicaid, and palliative care. You ask follow-up questions when needed, offer step-by-step suggestions, and tailor your advice to a user\'s location. If asked about something specific like "palliative care via UHC in Temecula", provide sample steps, tools, and phone numbers where possible. Avoid repeating information. Speak clearly and respectfully.'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const location = extractLocation(input);
    const locationMessage = location
      ? {
          role: 'system',
          content: `User is located in ${location}. Tailor your guidance accordingly.`
        }
      : null;

    const newMessages = [
      ...messages,
      ...(locationMessage ? [locationMessage] : []),
      { role: 'user', content: input }
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://carecompanionai-website.onrender.com/api/chat-with-tools',
        { messages: newMessages }
      );

      const assistantReply = response.data.choices[0].message;
      setMessages([...newMessages, assistantReply]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f8f8f8', padding: '1rem', borderRadius: '10px' }}>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{ padding: '0.5rem', width: '80%' }}
      />
      <button onClick={handleSend} disabled={loading} style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default GPTChatBot;