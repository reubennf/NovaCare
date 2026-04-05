import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

export default function FriendChatPage() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [friendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/social/friends/${friendId}/messages`)
      setMessages(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const message = input.trim()
    setInput('')
    setSending(true)
    try {
      await api.post('/social/friends/message', { message, friend_id: friendId })
      fetchMessages()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ width: 390, height: 844, margin: '0 auto', background: 'white', fontFamily: 'Inter', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '44px 24px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <div onClick={() => navigate('/social')} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Friend</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_type === 'user'
          return (
            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? '#20A090' : '#F5F5F5',
                color: isMe ? 'white' : 'black',
                fontSize: 14, lineHeight: 1.5
              }}>
                {msg.body}
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 }}>
            Say hello to your friend!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{ flex: 1, height: 40, borderRadius: 20, border: '1px solid #E0E0E0', padding: '0 16px', fontSize: 14, fontFamily: 'Inter', outline: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: 20, background: '#20A090', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() ? 0.5 : 1 }}
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