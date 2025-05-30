import React from 'react';
import GPTChatBot from './components/GPTChatBot';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2E86AB', color: 'white', padding: '1rem 2rem' }}>
        <h1 style={{ margin: 0 }}>CareCompanion AI</h1>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '3rem 2rem', backgroundColor: '#F1F7FB', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem' }}>Navigate Healthcare with Confidence</h2>
        <p style={{ maxWidth: '600px', margin: '1rem auto' }}>
          Your AI-powered assistant for understanding Medicare, avoiding surprise bills, and getting the care you need.
        </p>
        <button style={{ backgroundColor: '#2E86AB', color: 'white', border: 'none', padding: '0.8rem 1.5rem', fontSize: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
          Get Started
        </button>
      </section>

      {/* How It Works */}
      <section style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem' }}>How It Works</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '250px' }}>
            <h4>1. Ask a Question</h4>
            <p>Type or speak your healthcare question into the AI assistant.</p>
          </div>
          <div style={{ maxWidth: '250px' }}>
            <h4>2. Get Clear Answers</h4>
            <p>Receive step-by-step guidance tailored to your situation.</p>
          </div>
          <div style={{ maxWidth: '250px' }}>
            <h4>3. Take Action</h4>
            <p>Know what to do next — no confusion, no stress.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: '#E8F5E9', padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem' }}>Why CareCompanion AI?</h3>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '1rem auto', lineHeight: '2rem' }}>
          <li>✅ Easy for seniors and caregivers to use</li>
          <li>✅ Prevent surprise medical bills</li>
          <li>✅ Understand your Medicare options</li>
          <li>✅ Get peace of mind from trusted AI help</li>
        </ul>
      </section>

      {/* Chatbot */}
      <div style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}>
        <GPTChatBot />
      </div>

      {/* Footer */}
      <footer style={{ padding: '1rem', backgroundColor: '#f0f0f0', textAlign: 'center', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} CareCompanion AI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
