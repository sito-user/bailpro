import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import './AiAssistant.css';

const SUGGESTIONS = [
  "Qui n'a pas payé ce mois ?",
  "Quel est mon revenu total ?",
  "Combien de logements sont disponibles ?",
  "Quelles demandes de maintenance sont urgentes ?",
  "Donne-moi un résumé de mon parc locatif",
];

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis Wari, votre assistant immobilier intelligent. Posez-moi des questions sur vos logements, locataires, paiements ou demandes de maintenance.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const res = await client.post('/ai/chat', { message });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="ai-assistant">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sparkles size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Wari
          </h1>
          <p className="page-subtitle">Votre assistant immobilier intelligent</p>
        </div>
      </div>

      <div className="ai-chat">
        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ai-message--${msg.role}`}>
              <div className="ai-message__avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="ai-message__content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="ai-message ai-message--assistant">
              <div className="ai-message__avatar"><Bot size={16} /></div>
              <div className="ai-message__content ai-message__typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="ai-suggestion" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form className="ai-input-form" onSubmit={handleSubmit}>
          <input
            className="ai-input"
            type="text"
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="ai-send" type="submit" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
