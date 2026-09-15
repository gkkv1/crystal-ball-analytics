// src/ai/components/AiCopilot.jsx
// AI Chat / Q&A interface — main conversational entry point

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Compass } from 'lucide-react';
import { SimulationAIProvider } from '../engine/SimulationAIProvider.js';
import { SUGGESTED_PROMPTS } from '../types/ai.types.js';
import InsightCard from './InsightCard.jsx';
import VoiceButton from './VoiceButton.jsx';
import DemoScenarios from './DemoScenarios.jsx';

const GREETING = {
  id: 'greeting',
  role: 'ai',
  text: 'Hello! I\'m your **AI Analytics Copilot**. I can help you understand your business data — ask me about revenue performance, key risks, sales pipeline, customer satisfaction, or request an executive summary.',
  kpis: null,
  actions: null,
};

function MessageBubble({ message, onAction }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div style={{
          maxWidth: '85%',
          padding: '9px 13px',
          borderRadius: '12px 12px 4px 12px',
          background: 'rgba(37,99,235,0.85)',
          color: 'white',
          fontSize: 13,
          lineHeight: 1.55,
          fontWeight: 500,
        }}>
          {message.text}
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: 'linear-gradient(135deg, #1e3a5f, #2563EB)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles style={{ width: 12, height: 12, color: 'white' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {message.isThinking ? (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#2563EB', opacity: 0.4,
                animation: `ai-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <InsightCard
            text={message.text}
            kpis={message.kpis}
            actions={message.actions}
            suggestions={message.suggestions}
            isMultiLine={message.isMultiLine}
            onAction={onAction}
            style={{ borderRadius: '4px 12px 12px 12px' }}
          />
        )}
      </div>
    </div>
  );
}

export default function AiCopilot({ filters = {}, currentModule, onNavigate, onSetFilter, onSwitchTab }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter context summary for display
  const filterSummary = [
    filters.fiscalYear && filters.fiscalYear !== 'All' ? filters.fiscalYear : 'All FY',
    filters.quarter && filters.quarter !== 'All' ? filters.quarter : null,
    filters.bgCluster && filters.bgCluster !== 'All' ? filters.bgCluster : null,
    filters.geo && filters.geo !== 'All' ? filters.geo : null,
  ].filter(Boolean).join(' · ');

  async function sendMessage(question) {
    if (!question.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: question };
    const thinkingMsg = { id: Date.now() + 1, role: 'ai', isThinking: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput('');
    setLoading(true);

    // Small delay to show thinking animation
    await new Promise(r => setTimeout(r, 600));

    try {
      const response = SimulationAIProvider.answerQuestion(question, filters, currentModule);

      const aiMsg = {
        id: Date.now() + 2,
        role: 'ai',
        text: response.text,
        kpis: response.kpis,
        actions: response.actions,
        suggestions: response.suggestions,
        isMultiLine: response.isMultiLine,
        intent: response.intent,
      };

      setMessages(prev => [...prev.slice(0, -1), aiMsg]);
    } catch (e) {
      console.error('[AiCopilot] Error:', e);
      setMessages(prev => [...prev.slice(0, -1), {
        id: Date.now() + 2,
        role: 'ai',
        text: 'I encountered an error processing your request. Please try again.',
      }]);
    }

    setLoading(false);
  }

  const [navNotice, setNavNotice] = useState(null);

  function handleAction(action) {
    if (action.type === 'suggest') {
      sendMessage(action.question);
      return;
    }
    if (action.filterKey && action.filterValue) {
      onSetFilter && onSetFilter(action.filterKey, action.filterValue);
    }
    if (action.navigate) {
      onNavigate && onNavigate(action.navigate);
      setNavNotice(`Navigated to ${action.label || action.navigate}`);
      setTimeout(() => setNavNotice(null), 3000);
    }
    if (action.tab) {
      onSwitchTab && onSwitchTab(action.tab);
    }
  }

  function handleScenario(scenario) {
    setShowScenarios(false);
    sendMessage(scenario.preloadQuestion);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Filter context strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 0 10px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
            Analyzing: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{filterSummary}</span>
          </span>
        </div>
        <button
          onClick={() => setShowScenarios(v => !v)}
          style={{
            fontSize: 10.5, color: '#2563EB',
            border: '1px solid rgba(37,99,235,0.2)',
            cursor: 'pointer', fontWeight: 600, padding: '3px 8px',
            borderRadius: 6, background: 'rgba(37,99,235,0.06)',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.15s ease',
          }}
        >
          {showScenarios ? '← Back to Chat' : (
            <>
              <Compass style={{ width: 12, height: 12 }} />
              Scenarios
            </>
          )}
        </button>
      </div>

      {navNotice && (
        <div style={{
          padding: '4px 10px',
          background: 'rgba(5,150,105,0.08)',
          border: '1px solid rgba(5,150,105,0.25)',
          borderRadius: 6,
          color: '#059669',
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
          {navNotice}
        </div>
      )}

      {showScenarios ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <DemoScenarios onSelectScenario={handleScenario} />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onAction={handleAction} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 1 && (
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                Try asking:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {SUGGESTED_PROMPTS.slice(0, 6).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    style={{
                      padding: '4px 10px', borderRadius: 20,
                      border: '1px solid var(--border)', background: 'var(--bg-muted)',
                      color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                      fontWeight: 500, transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.color = '#2563EB'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business data..."
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-primary)',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <VoiceButton
              onTranscript={(t) => { setInput(t); setTimeout(() => sendMessage(t), 100); }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                border: 'none',
                background: input.trim() && !loading ? '#2563EB' : 'var(--border)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
