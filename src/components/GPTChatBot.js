import React, { useState } from 'react';
import axios from 'axios';

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a friendly healthcare assistant helping seniors.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', { messages });



      const reply = response.data.choices[0].message;
      setMessages([...newMessages, reply]);
    } catch (error) {
      console.error(error);
      alert('There was a problem contacting the assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '10px', marginTop: '2rem' }}>
      <h3>🧑‍⚕️ CareCompanionAI Chatbot</h3>
      <div style={{ height: '300px', overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#f9f9f9', padding: '1rem' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{m.role === 'user' ? 'You' : 'Bot'}:</strong> {m.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        style={{ width: '80%', padding: '0.5rem' }}
        placeholder="Ask me a question about Medicare..."
      />
      <button onClick={sendMessage} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
    </div>
  );
};

export default GPTChatBot;

