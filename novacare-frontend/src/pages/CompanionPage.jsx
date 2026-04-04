import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import ReactMarkdown from 'react-markdown'
import {
  getChatMessages,
  getChatThreadId,
  setChatMessages,
  setChatThreadId,
  clearChatStore
} from '../lib/chatStore'

export default function CompanionPage() {
  const [companion, setCompanion] = useState(null)
  const [messages, setMessages] = useState(() => getChatMessages())
  const [threadId, setThreadId] = useState(() => getChatThreadId())
  const [input, setInput] = useState('')
  const [greeting, setGreeting] = useState('Great work today!')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: 'Sushi', species: 'dog', personality: 'cheerful' })
  const messagesEndRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      case 'chick': return '/sushi.png'
      default: return '/sushi.png'
    }
  }
  const updateMessages = (updater) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setChatMessages(next)
      return next
    })
  }

  const updateThreadId = (id) => {
    setThreadId(id)
    setChatThreadId(id)
  }
  const getTime = () => {
    return new Date().toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  useEffect(() => {
    fetchCompanion()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCompanion = async () => {
    try {
      const res = await api.get('/companion/')
      setCompanion(res.data)

      // Fetch AI greeting
      try {
        const greetingRes = await api.get('/companion/greeting')
        setGreeting(greetingRes.data.greeting)
      } catch (e) {
        setGreeting('Great to see you today')
      }

    } catch (err) {
      if (err.response?.status === 404) setCreating(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompanion = async () => {
    try {
      const res = await api.post('/companion/', createForm)
      setCompanion(res.data)
      setCreating(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async (messageText) => {
    const message = messageText || input.trim()
    if (!message || sending) return
    setInput('')
    setSuggestions([])
    const time = getTime()
    updateMessages(prev => [...prev, { role: 'user', content: message, time }])
    setSending(true)

    try {
      const { supabase } = await import('../lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/companion/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            message,
            thread_id: threadId || undefined
          })
        }
      )

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let currentReply = ''
      let newThreadId = threadId
      const streamingMsgId = Date.now()

      updateMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        time: getTime(),
        id: streamingMsgId
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'meta') {
              newThreadId = data.thread_id
              updateThreadId(data.thread_id)
            }

            if (data.type === 'token') {
              currentReply += data.content
              updateMessages(prev => prev.map(m =>
                m.id === streamingMsgId
                  ? { ...m, content: currentReply }
                  : m
              ))
            }

            if (data.type === 'done') {
              setSending(false)
              try {
                const suggestRes = await api.post('/companion/chat/suggestions', {
                  message: currentReply,
                  thread_id: newThreadId
                })
                setSuggestions(suggestRes.data.suggestions || [])
              } catch (e) {
                setSuggestions(['Tell me more', 'I feel better', 'What should I do?'])
              }
              const companionRes = await api.get('/companion/')
              setCompanion(companionRes.data)
            }

          } catch (e) {
            // skip malformed chunks
          }
        }
      }

    } catch (err) {
      console.error(err)
      updateMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Try again!',
        time: getTime()
      }])
      setSending(false)
    }
  }

  if (loading) return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ color: '#aaa', fontFamily: 'Inter' }}>Loading...</p>
    </div>
  )

  if (creating) return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Inter',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 32px',
      boxSizing: 'border-box'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        Meet your companion
      </h2>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
        Create your very own pet companion
      </p>
      <input
        value={createForm.name}
        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
        placeholder="Name"
        style={{
          width: '100%',
          height: 48,
          borderRadius: 24,
          border: '1px solid #E0E0E0',
          padding: '0 20px',
          fontSize: 15,
          fontFamily: 'Inter',
          boxSizing: 'border-box',
          marginBottom: 12,
          outline: 'none'
        }}
      />
      <select
        value={createForm.species}
        onChange={e => setCreateForm({ ...createForm, species: e.target.value })}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 24,
          border: '1px solid #E0E0E0',
          padding: '0 20px',
          fontSize: 15,
          fontFamily: 'Inter',
          boxSizing: 'border-box',
          marginBottom: 12,
          outline: 'none'
        }}
      >
        <option value="dog">Dog 🐶</option>
        <option value="cat">Cat 🐱</option>
        <option value="chick">Chick 🐣</option>
      </select>
      <select
        value={createForm.personality}
        onChange={e => setCreateForm({ ...createForm, personality: e.target.value })}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 24,
          border: '1px solid #E0E0E0',
          padding: '0 20px',
          fontSize: 15,
          fontFamily: 'Inter',
          boxSizing: 'border-box',
          marginBottom: 24,
          outline: 'none'
        }}
      >
        <option value="cheerful">Cheerful</option>
        <option value="calm">Calm</option>
        <option value="gentle">Gentle</option>
      </select>
      <button
        onClick={handleCreateCompanion}
        style={{
          width: '100%',
          height: 52,
          background: '#20A090',
          border: 'none',
          borderRadius: 26,
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'Inter',
          cursor: 'pointer'
        }}
      >
        Create {createForm.name}!
      </button>
    </div>
  )

  return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '34px 24px 12px',
        textAlign: 'center',
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Back button */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            position: 'absolute',
            left: 24,
            cursor: 'pointer',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <span style={{ color: 'black', fontSize: 20, fontWeight: 700 }}>Nova</span>
        <span style={{ color: '#20A090', fontSize: 20, fontWeight: 700 }}>Pet</span>
      </div>
     {/* Greeting bubble */}
      <div style={{
        margin: '0 auto 8px',
        background: 'rgba(32,160,144,0.16)',
        borderRadius: 36,
        padding: '10px 24px',
        flexShrink: 0
      }}>
        <span style={{ color: 'black', fontSize: 16, fontWeight: 400 }}>
          {greeting}
        </span>
      </div>

      {/* Pet image */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        position: 'relative',
        flexShrink: 0,
        height: 230,
        marginBottom: 8
      }}>
        <img
          src={getPetImage(companion?.species)}
          alt="pet"
          style={{
            width: 400,
            height: 450,
            top: 80,
            objectFit: 'contain',
            position: 'relative',
            zIndex: 1
          }}
        />
        {/* Shadow */}
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 16,
          background: 'rgba(0,0,0,0.10)',
          borderRadius: 9999,
          filter: 'blur(8px)'
        }} />
      </div>

      {/* Messages - scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#aaa',
            fontSize: 13,
            marginTop: 5
          }}>
            Say hello to {companion?.name}!
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 8
          }}>
            {/* Bubble */}
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#20A090' : 'rgba(32,160,144,0.16)',
              color: msg.role === 'user' ? 'white' : '#000E08',
              fontSize: 12,
              lineHeight: '1.5',
              letterSpacing: 0.12
            }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <span>{children}</span>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            {/* Timestamp */}
            <div style={{
              fontSize: 10,
              color: '#797C7B',
              marginTop: 2,
              paddingLeft: msg.role === 'user' ? 0 : 4,
              paddingRight: msg.role === 'user' ? 4 : 0,
            }}>
              {msg.time}
            </div>
          </div>
        ))}

        {/* Typing indicator - only show before first token arrives */}
        {sending && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: 8
          }}>
            <div style={{
              background: 'rgba(32,160,144,0.16)',
              borderRadius: '16px 16px 16px 4px',
              padding: '10px 16px',
            }}>
              <span style={{
                color: 'black',
                fontSize: 12,
                opacity: 0.67,
                letterSpacing: 4
              }}>● ● ●</span>
            </div>
          </div>
        )}

        {/* Quick replies - show after last assistant message */}
        {messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          !sending && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 8
          }}>
            {/* Quick replies - show after last assistant message */}
            {suggestions.length > 0 && !sending && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 8
              }}>
                {suggestions.map(reply => (
                  <div
                    key={reply}
                    onClick={() => handleSend(reply)}
                    style={{
                      background: 'white',
                      boxShadow: '0px 4px 9px rgba(0,0,0,0.16)',
                      borderRadius: 16,
                      border: '1px solid rgba(0,0,0,0.09)',
                      padding: '8px 14px',
                      fontSize: 10,
                      cursor: 'pointer',
                      color: 'black'
                    }}
                  >
                    {reply}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #F0F0F0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        background: 'white'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Chat with ${companion?.name}...`}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            border: '1px solid #E0E0E0',
            padding: '0 16px',
            fontSize: 13,
            fontFamily: 'Inter',
            outline: 'none',
            color: '#333'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={sending || !input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#20A090',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: sending || !input.trim() ? 0.5 : 1,
            flexShrink: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  )
}