import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import LoadingScreen from '../components/LoadingScreen'


const PRESET_MEDICATIONS = [
  { name: 'Amlodipine', dosage: '5mg', frequency: 'once_daily', times: ['08:00'], purpose: 'High blood pressure' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'once_daily', times: ['08:00'], purpose: 'High blood pressure, heart protection' },
  { name: 'Losartan', dosage: '50mg', frequency: 'once_daily', times: ['08:00'], purpose: 'High blood pressure, kidney protection' },
  { name: 'Metoprolol', dosage: '25mg', frequency: 'twice_daily', times: ['08:00', '20:00'], purpose: 'High blood pressure, heart problems' },
  { name: 'Furosemide', dosage: '40mg', frequency: 'once_daily', times: ['08:00'], purpose: 'Fluid retention, heart failure' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'once_daily', times: ['21:00'], purpose: 'High cholesterol' },
  { name: 'Aspirin', dosage: '100mg', frequency: 'once_daily', times: ['08:00'], purpose: 'Blood thinning, heart/stroke prevention' },
  { name: 'Clopidogrel', dosage: '75mg', frequency: 'once_daily', times: ['08:00'], purpose: 'Blood thinner' },
  { name: 'Metformin', dosage: '500mg', frequency: 'twice_daily', times: ['08:00', '20:00'], purpose: 'Type 2 diabetes' },
  { name: 'Insulin', dosage: 'As prescribed', frequency: 'three_times_daily', times: ['07:30', '12:30', '18:30'], purpose: 'Diabetes' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'once_daily', times: ['07:00'], purpose: 'Low thyroid' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'once_daily', times: ['07:30'], purpose: 'Acid reflux, stomach ulcer protection' },
  { name: 'Acetaminophen (Paracetamol)', dosage: '500mg', frequency: 'as_needed', times: ['08:00'], purpose: 'Pain, fever' },
  { name: 'Ibuprofen', dosage: '400mg', frequency: 'as_needed', times: ['08:00'], purpose: 'Pain, inflammation' },
  { name: 'Gabapentin', dosage: '100mg', frequency: 'three_times_daily', times: ['08:00', '14:00', '20:00'], purpose: 'Nerve pain' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'once_daily', times: ['08:00'], purpose: 'Depression, anxiety' },
  { name: 'Donepezil', dosage: '5mg', frequency: 'once_daily', times: ['21:00'], purpose: 'Dementia symptoms' },
  { name: 'Memantine', dosage: '5mg', frequency: 'once_daily', times: ['08:00'], purpose: 'Dementia symptoms' },
  { name: 'Alendronate', dosage: '70mg', frequency: 'once_weekly', times: ['08:00'], purpose: 'Osteoporosis' },
]

const FREQUENCY_LABELS = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: '3 times daily',
  once_weekly: 'Once weekly',
  as_needed: 'As needed',
}

const CATEGORY_COLORS = {
  'High blood pressure': '#FF6B6B',
  'High cholesterol': '#FFA500',
  'Diabetes': '#4ECDC4',
  'Heart': '#FF6B6B',
  'Pain': '#9B59B6',
  'Thyroid': '#3498DB',
  'Stomach': '#27AE60',
  'Mental health': '#E91E63',
  'Bone': '#795548',
  'default': '#20A090',
}

const getMedColor = (purpose) => {
  if (purpose.includes('blood pressure') || purpose.includes('heart')) return '#FF6B6B'
  if (purpose.includes('cholesterol')) return '#FFA500'
  if (purpose.includes('diabetes') || purpose.includes('Diabetes')) return '#4ECDC4'
  if (purpose.includes('pain') || purpose.includes('fever')) return '#9B59B6'
  if (purpose.includes('thyroid')) return '#3498DB'
  if (purpose.includes('acid') || purpose.includes('stomach')) return '#27AE60'
  if (purpose.includes('depression') || purpose.includes('anxiety') || purpose.includes('dementia')) return '#E91E63'
  if (purpose.includes('osteoporosis') || purpose.includes('bone')) return '#795548'
  if (purpose.includes('blood thin')) return '#E74C3C'
  return '#20A090'
}

export default function MedicationsPage() {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [addingPreset, setAddingPreset] = useState(null)
  const [markingDone, setMarkingDone] = useState(null)
  const [customForm, setCustomForm] = useState({
    name: '', dosage: '', frequency: 'once_daily', times: ['08:00'], notes: ''
  })
  const [addingCustom, setAddingCustom] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [medsRes, logsRes] = await Promise.allSettled([
        api.get('/medications/'),
        api.get('/medications/logs/today'),
      ])
      if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data || [])
      if (logsRes.status === 'fulfilled') setTodayLogs(logsRes.value.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async (medId, medName) => {
    if (!confirm(`Remove ${medName} from your medications?`)) return
    try {
      await api.delete(`/medications/${medId}`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }
  const handleAddPreset = async (preset) => {
    setAddingPreset(preset.name)
    try {
      const res = await api.post('/medications/', {
        name: preset.name,
        dosage: preset.dosage,
        notes: preset.purpose
      })
      const medId = res.data.id
      await api.post(`/medications/${medId}/schedules`, {
        frequency: preset.frequency,
        times_of_day: preset.times,
        start_date: new Date().toISOString().split('T')[0]
      })
      await fetchData()
      setShowPresets(false)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingPreset(null)
    }
  }

  const handleAddCustom = async () => {
    if (!customForm.name || !customForm.dosage) return
    setAddingCustom(true)
    try {
      const res = await api.post('/medications/', {
        name: customForm.name,
        dosage: customForm.dosage,
        notes: customForm.notes
      })
      await api.post(`/medications/${res.data.id}/schedules`, {
        frequency: customForm.frequency,
        times_of_day: customForm.times,
        start_date: new Date().toISOString().split('T')[0]
      })
      setCustomForm({ name: '', dosage: '', frequency: 'once_daily', times: ['08:00'], notes: '' })
      setShowAdd(false)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingCustom(false)
    }
  }

  const handleMarkTaken = async (logId) => {
    setMarkingDone(logId)
    try {
      await api.patch(`/medications/logs/${logId}`, { status: 'taken' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingDone(null)
    }
  }

  const handleMarkSkipped = async (logId) => {
    try {
      await api.patch(`/medications/logs/${logId}`, { status: 'skipped' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const takenCount = todayLogs.filter(l => l.status === 'taken').length
  const totalCount = todayLogs.length
  const pendingLogs = todayLogs.filter(l => l.status === 'pending')
  const takenLogs = todayLogs.filter(l => l.status === 'taken')
  const existingNames = medications.map(m => m.name.toLowerCase())

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 22,
    border: '1px solid #E0E0E0', padding: '0 16px',
    fontSize: 14, fontFamily: 'Inter', boxSizing: 'border-box', outline: 'none', marginBottom: 10
  }

  if (loading) return <LoadingScreen message="Loading your meds..." />

  return (
    <div style={{ width: 390, height: 844, margin: '0 auto', background: '#F8F9FA', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '44px 24px 0', background: '#F8F9FA', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 }}>
          <div onClick={() => navigate('/dashboard')} style={{ position: 'absolute', left: 0, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ position: 'absolute', right: 0, background: '#20A090', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer', padding: '6px 14px' }}
          >
            + Add
          </button>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'black' }}>
          My Medications
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: '0 0 16px' }}>
          Always follow your doctor's prescription
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>

        {/* Progress card */}
        {totalCount > 0 && (
          <div style={{ background: '#20A090', borderRadius: 20, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '0 0 4px' }}>Today's doses</p>
              <h2 style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: 0 }}>{takenCount}/{totalCount} taken</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36 }}>💊</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '4px 0 0' }}>
                {totalCount - takenCount} remaining
              </p>
            </div>
          </div>
        )}

        {/* Add medication panel */}
        {showAdd && (
          <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => { setShowPresets(true) }}
                style={{ flex: 1, height: 44, background: 'rgba(32,160,144,0.1)', border: '1.5px solid #20A090', borderRadius: 22, color: '#20A090', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}
              >
                Choose from list
              </button>
              <button
                onClick={() => setShowPresets(false)}
                style={{ flex: 1, height: 44, background: !showPresets ? '#20A090' : 'white', border: '1.5px solid #20A090', borderRadius: 22, color: !showPresets ? 'white' : '#20A090', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}
              >
                Custom medication
              </button>
            </div>

            {showPresets ? (
              <div>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Tap a medication to add it with standard dosage:</p>
                {PRESET_MEDICATIONS.filter(p => !existingNames.includes(p.name.toLowerCase())).map(preset => (
                  <div
                    key={preset.name}
                    onClick={() => handleAddPreset(preset)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', marginBottom: 8, background: '#F9F9F9', borderRadius: 12, cursor: 'pointer', opacity: addingPreset === preset.name ? 0.5 : 1 }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'black' }}>{preset.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{preset.dosage} · {FREQUENCY_LABELS[preset.frequency]}</div>
                      <div style={{ fontSize: 11, color: getMedColor(preset.purpose), marginTop: 1 }}>{preset.purpose}</div>
                    </div>
                    <span style={{ color: '#20A090', fontSize: 20, fontWeight: 300 }}>
                      {addingPreset === preset.name ? '...' : '+'}
                    </span>
                  </div>
                ))}
                {PRESET_MEDICATIONS.filter(p => !existingNames.includes(p.name.toLowerCase())).length === 0 && (
                  <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>All preset medications added!</p>
                )}
              </div>
            ) : (
              <div>
                <input value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} placeholder="Medication name" style={inputStyle} />
                <input value={customForm.dosage} onChange={e => setCustomForm({...customForm, dosage: e.target.value})} placeholder="Dosage (e.g. 10mg)" style={inputStyle} />
                <input value={customForm.notes} onChange={e => setCustomForm({...customForm, notes: e.target.value})} placeholder="Purpose / notes (optional)" style={inputStyle} />
                <select value={customForm.frequency} onChange={e => setCustomForm({...customForm, frequency: e.target.value})} style={inputStyle}>
                  <option value="once_daily">Once daily</option>
                  <option value="twice_daily">Twice daily</option>
                  <option value="three_times_daily">3 times daily</option>
                  <option value="once_weekly">Once weekly</option>
                  <option value="as_needed">As needed</option>
                </select>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>Reminder time(s):</p>
                  {customForm.times.map((t, i) => (
                    <input key={i} type="time" value={t} onChange={e => {
                      const times = [...customForm.times]
                      times[i] = e.target.value
                      setCustomForm({...customForm, times})
                    }} style={{ ...inputStyle, width: 'auto', marginRight: 8 }} />
                  ))}
                </div>
                <button
                  onClick={handleAddCustom}
                  disabled={!customForm.name || !customForm.dosage || addingCustom}
                  style={{ width: '100%', height: 44, background: '#20A090', border: 'none', borderRadius: 22, color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer', opacity: !customForm.name ? 0.5 : 1 }}
                >
                  {addingCustom ? 'Adding...' : 'Add medication'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Today's pending doses */}
        {pendingLogs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'black', margin: '0 0 8px' }}>⏰ Due today</p>
            {pendingLogs.map(log => {
              const med = medications.find(m => m.id === log.medication_id)
              const color = getMedColor(med?.notes || '')
              return (
                <div key={log.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${color}22` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    💊
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'black' }}>{med?.name || 'Medication'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{med?.dosage} · Due {log.due_at ? new Date(log.due_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'today'}</p>
                    {med?.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color }}>{med.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => handleMarkTaken(log.id)}
                      disabled={markingDone === log.id}
                      style={{ background: '#20A090', border: 'none', borderRadius: 16, color: 'white', fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Inter', opacity: markingDone === log.id ? 0.5 : 1 }}
                    >
                      {markingDone === log.id ? '...' : '✓ Taken'}
                    </button>
                    <button
                      onClick={() => handleMarkSkipped(log.id)}
                      style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: 16, color: '#888', fontSize: 11, padding: '4px 14px', cursor: 'pointer', fontFamily: 'Inter' }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Taken doses */}
        {takenLogs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'black', margin: '0 0 8px' }}>✅ Taken today</p>
            {takenLogs.map(log => {
              const med = medications.find(m => m.id === log.medication_id)
              return (
                <div key={log.id} style={{ background: 'rgba(32,160,144,0.05)', borderRadius: 16, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(32,160,144,0.15)' }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, color: 'rgba(0,0,0,0.5)', textDecoration: 'line-through' }}>{med?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#20A090' }}>Taken ✓</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* My medications list */}
        {medications.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'black', margin: '0 0 8px' }}>My medications ({medications.length})</p>
            {medications.map(med => {
              const color = getMedColor(med.notes || '')
              return (
                <div key={med.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'black' }}>{med.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{med.dosage}</p>
                    {med.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color }}>{med.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(med.id, med.name)}
                    style={{ background: 'transparent', border: '1px solid #FFE0E0', borderRadius: 16, color: '#E53E3E', fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Inter', flexShrink: 0 }}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {medications.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>No medications added yet</p>
            <button onClick={() => setShowAdd(true)} style={{ background: '#20A090', border: 'none', borderRadius: 22, color: 'white', fontSize: 14, fontWeight: 600, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Inter' }}>
              Add my medications
            </button>
          </div>
        )}

      </div>
    </div>
  )
}