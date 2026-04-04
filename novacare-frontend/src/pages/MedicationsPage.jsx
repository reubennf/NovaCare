import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function MedicationsPage() {
  const [medications, setMedications] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', dosage_amount: '', dosage_unit: 'mg', form: 'tablet', instructions: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [medsRes, logsRes] = await Promise.all([
        api.get('/medications/'),
        api.get('/medications/logs/today')
      ])
      setMedications(medsRes.data)
      setTodayLogs(logsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedication = async () => {
    setSaving(true)
    try {
      const res = await api.post('/medications/', {
        ...form,
        dosage_amount: parseFloat(form.dosage_amount),
        start_date: new Date().toISOString().split('T')[0]
      })
      // Create a default daily schedule
      await api.post(`/medications/${res.data.id}/schedules`, {
        schedule_type: 'daily',
        times_per_day: 1,
        time_slots: ['08:00'],
        days_of_week: [1,2,3,4,5,6,7]
      })
      setShowAdd(false)
      setForm({ name: '', dosage_amount: '', dosage_unit: 'mg', form: 'tablet', instructions: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkTaken = async (logId) => {
    try {
      await api.patch(`/medications/logs/${logId}`, { status: 'taken' })
      fetchData()
    } catch (err) {
      console.error(err)
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

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Medications</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          + Add medication
        </button>
      </div>

      {/* Add medication form */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800">New medication</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Medication name</label>
              <input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="e.g. Metformin"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Dosage</label>
              <input
                value={form.dosage_amount}
                onChange={e => setForm({...form, dosage_amount: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="500"
                type="number"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Unit</label>
              <select
                value={form.dosage_unit}
                onChange={e => setForm({...form, dosage_unit: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="tablet">tablet</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Form</label>
              <select
                value={form.form}
                onChange={e => setForm({...form, form: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="liquid">Liquid</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Instructions</label>
              <input
                value={form.instructions}
                onChange={e => setForm({...form, instructions: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="e.g. Take after meals"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddMedication}
              disabled={saving || !form.name}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save medication'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-gray-400 px-4 py-2 rounded-lg text-sm hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Today's doses */}
      {todayLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Today's doses</h2>
          <div className="space-y-3">
            {todayLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {log.status === 'taken' ? '✅' : log.status === 'skipped' ? '⏭️' : log.status === 'missed' ? '❌' : '💊'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(log.due_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{log.status}</p>
                  </div>
                </div>
                {log.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkTaken(log.id)}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200"
                    >
                      Taken
                    </button>
                    <button
                      onClick={() => handleMarkSkipped(log.id)}
                      className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medication list */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">My medications</h2>
        {medications.length === 0 ? (
          <p className="text-gray-400 text-sm">No medications added yet</p>
        ) : (
          <div className="space-y-3">
            {medications.map(med => (
              <div key={med.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{med.name}</p>
                  <p className="text-xs text-gray-400">{med.dosage_amount}{med.dosage_unit} · {med.form}</p>
                  {med.instructions && <p className="text-xs text-gray-400">{med.instructions}</p>}
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}