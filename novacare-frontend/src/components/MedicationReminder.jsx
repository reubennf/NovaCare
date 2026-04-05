import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'

export default function MedicationReminder() {
  const [reminder, setReminder] = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const checkRef = useRef(null)

  const checkForDueMedications = async () => {
    try {
      const res = await api.get('/medications/logs/today')
      const logs = res.data || []
      const now = new Date()

      // Find a pending dose due within next 15 minutes
      const dueSoon = logs.find(log => {
        if (log.status !== 'pending') return false
        if (!log.due_at) return false
        const dueAt = new Date(log.due_at)
        const diffMinutes = (dueAt - now) / 1000 / 60
        return diffMinutes >= -5 && diffMinutes <= 15
      })

      if (dueSoon && !visible) {
        // Get medication name
        const medsRes = await api.get('/medications/')
        const meds = medsRes.data || []
        const med = meds.find(m => m.id === dueSoon.medication_id)
        if (med) {
          setReminder({ log: dueSoon, med })
          setVisible(true)

          // Auto-dismiss after 15 seconds
          timerRef.current = setTimeout(() => {
            setVisible(false)
            setReminder(null)
          }, 15000)
        }
      }
    } catch (err) {
      // Silently fail — don't interrupt the user
    }
  }

  useEffect(() => {
    // Check on mount
    checkForDueMedications()

    // Check every 5 minutes
    checkRef.current = setInterval(checkForDueMedications, 5 * 60 * 1000)

    return () => {
      clearInterval(checkRef.current)
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleDismiss = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
    setReminder(null)
  }

  const handleTaken = async () => {
    if (!reminder) return
    try {
      await api.patch(`/medications/logs/${reminder.log.id}`, { status: 'taken' })
    } catch (err) {
      console.error(err)
    }
    handleDismiss()
  }

  if (!visible || !reminder) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Reminder card */}
      <div style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 340,
        background: 'white',
        borderRadius: 24,
        padding: '20px 20px 16px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideDown 0.3s ease',
        fontFamily: 'Inter, sans-serif'
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
          @keyframes countdown { from { width: 100% } to { width: 0% } }
        `}</style>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{ position: 'absolute', top: 12, right: 12, background: '#F5F5F5', border: 'none', borderRadius: 16, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(32,160,144,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            💊
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'black' }}>Time for your medicine!</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#20A090', fontWeight: 600 }}>{reminder.med.name}</p>
          </div>
        </div>

        {/* Details */}
        <div style={{ background: '#F9F9F9', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
            <strong>{reminder.med.dosage}</strong>
            {reminder.med.notes && ` · ${reminder.med.notes}`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#aaa' }}>
            Due at {new Date(reminder.log.due_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleTaken}
            style={{ flex: 2, height: 44, background: '#20A090', border: 'none', borderRadius: 22, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}
          >
            ✓ I've taken it
          </button>
          <button
            onClick={handleDismiss}
            style={{ flex: 1, height: 44, background: '#F5F5F5', border: 'none', borderRadius: 22, color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}
          >
            Later
          </button>
        </div>

        {/* 15 second countdown bar */}
        <div style={{ height: 3, background: '#F0F0F0', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#20A090', borderRadius: 2, animation: 'countdown 15s linear forwards' }} />
        </div>
        <p style={{ fontSize: 10, color: '#ccc', textAlign: 'center', margin: '4px 0 0' }}>Auto-dismisses in 15 seconds</p>
      </div>
    </>
  )
}