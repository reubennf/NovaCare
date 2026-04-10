import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const CONDITIONS = [
  'High Blood Pressure',
  'Diabetes',
  'Heart Disease',
  'High Cholesterol',
  'Arthritis / Joint Pain',
  'Asthma',
  'Depression / Anxiety',
  'Osteoporosis',
]

const FREQUENCY_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const [answers, setAnswers] = useState({
    preferred_name: '',        // NEW
    pet_name: '',              // NEW
    pet_species: 'dog',        // NEW
    text_size: 'normal',
    voice_mode_enabled: false,
    high_contrast_enabled: false,
    healthhub_sync: null,
    assigned_doctor: '',
    takes_daily_medication: null,
    has_support_person: null,
    health_conditions: [],
  })

  // Medication entries
  const [medications, setMedications] = useState([
    { name: '', frequency: '' }
  ])

  // Caregiver entries
  const [caregivers, setCaregivers] = useState([
    { name: '', relationship: '', phone: '' }
  ])

  // Dynamic total steps based on answers
  const getTotalSteps = () => {
    let total = 6
    if (answers.takes_daily_medication === true) total++
    if (answers.has_support_person === true) total++
    if (answers.healthhub_sync === false) total--
    return total
  }

  const isAnswered = () => {
    switch (step) {
      case 1: return answers.preferred_name.trim().length > 0 && answers.pet_name.trim().length > 0
      case 2: return true
      case 3: return answers.healthhub_sync !== null
      case 4: return true
      case 5: return answers.takes_daily_medication !== null
      case 6: return answers.has_support_person !== null
      case 7: return true
      default: return true
    }
  }

  const getNextStep = () => {
    if (step === 3 && answers.healthhub_sync === false) return 5
    if (step === 5 && answers.takes_daily_medication === false) return 6
    if (step === 6 && answers.has_support_person === false) return 7
    return step + 1
    }

  const getPrevStep = () => {
    if (step === 5 && answers.healthhub_sync === false) return 3
    if (step === 6 && answers.takes_daily_medication === false) return 5
    if (step === 7 && answers.has_support_person === false) return 6
    return step - 1
    }

  // Step labels for mapping
  // 1: Accessibility
  // 2: HealthHub
  // 3: Doctor (skipped if no HealthHub)
  // 4: Medication yes/no
  // 5: Support person yes/no
  // 5.5: Medication details (if yes)
  // 5.7: Caregiver details (if yes)
  // 6: Health conditions
  // We use decimal steps for the extra pages
  const [extraStep, setExtraStep] = useState(null)
  // extraStep: null | 'medication_details' | 'caregiver_details'

  const next = () => {
    if (!isAnswered()) {
      setShowWarning(true)
      return
    }
    setShowWarning(false)

    // After step 4 (medication yes/no), if yes go to medication details
    if (step === 4 && answers.takes_daily_medication === true && extraStep === null) {
      setExtraStep('medication_details')
      return
    }

    // After step 5 (support yes/no), if yes go to caregiver details
    if (step === 5 && answers.has_support_person === true && extraStep === null) {
      setExtraStep('caregiver_details')
      return
    }

    // Coming from extra steps
    if (extraStep === 'medication_details') {
      setExtraStep(null)
      setStep(5)
      return
    }

    if (extraStep === 'caregiver_details') {
      setExtraStep(null)
      setStep(6)
      return
    }

    const next = getNextStep()
    setStep(next)
  }

  const back = () => {
    setShowWarning(false)

    if (extraStep === 'medication_details') {
      setExtraStep(null)
      return
    }

    if (extraStep === 'caregiver_details') {
      setExtraStep(null)
      return
    }

    setStep(getPrevStep())
  }

  const toggleCondition = (condition) => {
    setAnswers(prev => ({
      ...prev,
      health_conditions: prev.health_conditions.includes(condition)
        ? prev.health_conditions.filter(c => c !== condition)
        : [...prev.health_conditions, condition]
    }))
  }

  const addMedication = () => {
    setMedications(prev => [...prev, { name: '', frequency: '' }])
  }

  const updateMedication = (index, field, value) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const removeMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index))
  }

  const addCaregiver = () => {
    setCaregivers(prev => [...prev, { name: '', relationship: '', phone: '' }])
  }

  const updateCaregiver = (index, field, value) => {
    setCaregivers(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const removeCaregiver = (index) => {
    setCaregivers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
        // Save profile name
        await api.patch('/profile/', {
        preferred_name: answers.preferred_name
        })

        // Complete onboarding — only send schema-valid fields
        await api.post('/onboarding/complete', {
        text_size: answers.text_size,
        voice_mode_enabled: answers.voice_mode_enabled,
        high_contrast_enabled: answers.high_contrast_enabled,
        healthhub_sync: answers.healthhub_sync ?? false,
        assigned_doctor: answers.assigned_doctor,
        takes_daily_medication: answers.takes_daily_medication ?? false,
        has_support_person: answers.has_support_person ?? false,
        health_conditions: answers.health_conditions || [],
        })

        // Create companion
        await api.post('/companion/', {
        name: answers.pet_name || 'Sushi',
        species: answers.pet_species || 'dog',
        personality: 'cheerful'
        })

        // Submit medications if any
        const validMeds = medications.filter(m => m.name.trim())
        for (const med of validMeds) {
        try {
            const res = await api.post('/medications/', {
            name: med.name,
            start_date: new Date().toISOString().split('T')[0]
            })
            const timeSlots = {
            'Once daily': ['08:00'],
            'Twice daily': ['08:00', '20:00'],
            'Three times daily': ['08:00', '13:00', '20:00'],
            'Weekly': ['08:00'],
            'As needed': ['08:00'],
            }
            await api.post(`/medications/${res.data.id}/schedules`, {
            schedule_type: 'daily',
            times_per_day: timeSlots[med.frequency]?.length || 1,
            time_slots: timeSlots[med.frequency] || ['08:00'],
            days_of_week: [1, 2, 3, 4, 5, 6, 7]
            })
        } catch (e) {
            console.error('Med error:', e)
        }
        }

        // Submit caregivers if any
        const validCaregivers = caregivers.filter(c => c.name.trim())
        for (const cg of validCaregivers) {
        try {
            await api.post('/caregiver/contacts', {
            name: cg.name,
            relationship: cg.relationship,
            phone: cg.phone,
            can_view_summaries: true,
            can_receive_alerts: true,
            })
        } catch (e) {
            console.error('Caregiver error:', e)
        }
        }

        navigate('/dashboard')
    } catch (err) {
        console.error('Onboarding submit error:', err)
        navigate('/dashboard')
    } finally {
        setSubmitting(false)
    }
    }

  const optionStyle = (isSelected) => ({
    width: '100%',
    height: 48,
    borderRadius: 24,
    border: `1px solid ${isSelected ? '#20A090' : '#E0E0E0'}`,
    background: isSelected ? 'rgba(32,160,144,0.08)' : 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    cursor: 'pointer',
    fontSize: 15,
    color: isSelected ? '#20A090' : 'black',
    fontWeight: isSelected ? 600 : 400,
    transition: 'all 0.2s'
  })

  const inputStyle = {
    width: '100%',
    height: 48,
    borderRadius: 24,
    border: '1px solid #E0E0E0',
    padding: '0 20px',
    fontSize: 15,
    fontFamily: 'Inter',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 10
  }

  const isLastStep = step === 7 && extraStep === null

  return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{ padding: '48px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 4,
          background: '#F0F0F0',
          borderRadius: 2,
          marginBottom: 24
        }}>
          <div style={{
            width: `${(step / 7) * 100}%`,
            height: 4,
            background: '#20A090',
            borderRadius: 2,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Back button */}
        {(step > 1 || extraStep) && (
          <div
            onClick={back}
            style={{ cursor: 'pointer', fontSize: 24, color: '#191D30', marginBottom: 8 }}
          >
            ‹
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
        {/* Step 1 - Personal info */}
        {step === 1 && !extraStep && (
        <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
            Welcome! Let's get to<br />
            <span style={{ color: '#20A090' }}>know you</span>
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
            Tell us a little about yourself
            </p>

            <p style={{ fontSize: 13, color: '#555', margin: '0 0 6px', fontWeight: 600 }}>Your name</p>
            <input
            value={answers.preferred_name}
            onChange={e => setAnswers(prev => ({ ...prev, preferred_name: e.target.value }))}
            placeholder="What should we call you?"
            style={inputStyle}
            />

            <p style={{ fontSize: 13, color: '#555', margin: '12px 0 6px', fontWeight: 600 }}>
            Name your companion
            </p>
            <input
            value={answers.pet_name}
            onChange={e => setAnswers(prev => ({ ...prev, pet_name: e.target.value }))}
            placeholder="e.g. Sushi, Mochi, Biscuit..."
            style={inputStyle}
            />

            <p style={{ fontSize: 13, color: '#555', margin: '12px 0 10px', fontWeight: 600 }}>
            Choose your companion
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
                { id: 'dog', emoji: '🐶', label: 'Dog', desc: 'Loyal & energetic' },
                { id: 'cat', emoji: '🐱', label: 'Cat', desc: 'Calm & cozy' },
                { id: 'sheep', emoji: '🐑', label: 'Sheep', desc: 'Gentle & fluffy' },
                { id: 'chicken', emoji: '🐔', label: 'Chicken', desc: 'Cheerful & fun' },
            ].map(pet => (
                <div
                key={pet.id}
                onClick={() => setAnswers(prev => ({ ...prev, pet_species: pet.id }))}
                style={{
                    borderRadius: 16,
                    border: `2px solid ${answers.pet_species === pet.id ? '#20A090' : '#E0E0E0'}`,
                    background: answers.pet_species === pet.id ? 'rgba(32,160,144,0.06)' : 'white',
                    padding: '14px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                >
                <span style={{ fontSize: 36 }}>{pet.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{pet.label}</span>
                <span style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>{pet.desc}</span>
                {answers.pet_species === pet.id && (
                    <span style={{ fontSize: 10, background: 'rgba(32,160,144,0.1)', color: '#20A090', fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>
                    Selected
                    </span>
                )}
                </div>
            ))}
            </div>
        </div>
        )}
        {/* Step 2 - Accessibility */}
        {step === 2 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              How would you like<br />to use <span style={{ color: '#20A090' }}>NovaCare</span>?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              You can change these anytime
            </p>

            {/* Use current settings button */}
            <div
              onClick={() => {
                setAnswers(prev => ({
                  ...prev,
                  text_size: 'normal',
                  voice_mode_enabled: false,
                  high_contrast_enabled: false
                }))
                setStep(2)
              }}
              style={{
                ...optionStyle(false),
                border: '1.5px solid #20A090',
                color: '#20A090',
                fontWeight: 600,
                marginBottom: 20
              }}
            >
              Use current settings
            </div>

            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', marginBottom: 16 }}>
              or customise below
            </p>

            {[
              { label: 'Increase text size', key: 'text_size', value: 'large' },
              { label: 'Voice mode', key: 'voice_mode_enabled', value: true },
              { label: 'High contrast mode', key: 'high_contrast_enabled', value: true },
            ].map(option => {
              const isSelected = answers[option.key] === option.value
              return (
                <div
                  key={option.label}
                  onClick={() => setAnswers(prev => ({
                    ...prev,
                    [option.key]: isSelected
                      ? (option.value === true ? false : 'normal')
                      : option.value
                  }))}
                  style={optionStyle(isSelected)}
                >
                  {option.label}
                </div>
              )
            })}
          </div>
        )}

        {/* Step 3 - HealthHub */}
        {step === 3 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              Would you like to<br />sync to HealthHub?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
              This helps us personalise your health experience
            </p>
            {[
              { label: 'Yes, please', value: true },
              { label: 'Not now, maybe later', value: false },
            ].map(option => (
              <div
                key={option.label}
                onClick={() => {
                  setAnswers(prev => ({ ...prev, healthhub_sync: option.value }))
                  setShowWarning(false)
                }}
                style={optionStyle(answers.healthhub_sync === option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {/* Step 4 - Doctor */}
        {step === 4 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              Is this your assigned<br />doctor?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
              We'll keep this for your records
            </p>
            <input
              value={answers.assigned_doctor}
              onChange={e => setAnswers(prev => ({ ...prev, assigned_doctor: e.target.value }))}
              placeholder="Doctor's name (optional)"
              style={inputStyle}
            />
            <input
              placeholder="Clinic / Hospital (optional)"
              style={inputStyle}
            />
          </div>
        )}

        {/* Step 5 - Medication yes/no */}
        {step === 5 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              Do you take daily{' '}
              <span style={{ color: '#20A090' }}>medication</span>?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
              This helps me remind you at the right time
            </p>
            {[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ].map(option => (
              <div
                key={option.label}
                onClick={() => {
                  setAnswers(prev => ({ ...prev, takes_daily_medication: option.value }))
                  setShowWarning(false)
                }}
                style={optionStyle(answers.takes_daily_medication === option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {/* Medication details extra step */}
        {extraStep === 'medication_details' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              What <span style={{ color: '#20A090' }}>medications</span><br />do you take?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              We'll set up reminders for you
            </p>

            {medications.map((med, index) => (
              <div key={index} style={{
                background: '#F9F9F9',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                    Medication {index + 1}
                  </p>
                  {medications.length > 1 && (
                    <span
                      onClick={() => removeMedication(index)}
                      style={{ fontSize: 13, color: '#E53E3E', cursor: 'pointer' }}
                    >
                      Remove
                    </span>
                  )}
                </div>
                <input
                  value={med.name}
                  onChange={e => updateMedication(index, 'name', e.target.value)}
                  placeholder="Medication name (e.g. Metformin)"
                  style={{ ...inputStyle, background: 'white' }}
                />
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 8px 4px' }}>Frequency</p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 4
                }}>
                  {FREQUENCY_OPTIONS.map(freq => (
                    <div
                      key={freq}
                      onClick={() => updateMedication(index, 'frequency', freq)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: `1px solid ${med.frequency === freq ? '#20A090' : '#E0E0E0'}`,
                        background: med.frequency === freq ? 'rgba(32,160,144,0.08)' : 'white',
                        color: med.frequency === freq ? '#20A090' : '#555',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: med.frequency === freq ? 600 : 400,
                      }}
                    >
                      {freq}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div
              onClick={addMedication}
              style={{
                textAlign: 'center',
                color: '#20A090',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '12px 0'
              }}
            >
              + Add another medication
            </div>
          </div>
        )}

        {/* Step 6 - Support person yes/no */}
        {step === 6 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              Do you want to add someone who{' '}
              <span style={{ color: '#20A090' }}>supports you</span>?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
              Everyone deserves a little support
            </p>
            {[
              { label: "Yes, I'd like to add someone", value: true },
              { label: 'Not now', value: false },
            ].map(option => (
              <div
                key={option.label}
                onClick={() => {
                  setAnswers(prev => ({ ...prev, has_support_person: option.value }))
                  setShowWarning(false)
                }}
                style={optionStyle(answers.has_support_person === option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {/* Caregiver details extra step */}
        {extraStep === 'caregiver_details' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              Who <span style={{ color: '#20A090' }}>supports</span> you?
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              They'll receive summaries and alerts
            </p>

            {caregivers.map((cg, index) => (
              <div key={index} style={{
                background: '#F9F9F9',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                    Person {index + 1}
                  </p>
                  {caregivers.length > 1 && (
                    <span
                      onClick={() => removeCaregiver(index)}
                      style={{ fontSize: 13, color: '#E53E3E', cursor: 'pointer' }}
                    >
                      Remove
                    </span>
                  )}
                </div>
                <input
                  value={cg.name}
                  onChange={e => updateCaregiver(index, 'name', e.target.value)}
                  placeholder="Their name"
                  style={{ ...inputStyle, background: 'white' }}
                />
                <input
                  value={cg.relationship}
                  onChange={e => updateCaregiver(index, 'relationship', e.target.value)}
                  placeholder="Relationship (e.g. daughter, son)"
                  style={{ ...inputStyle, background: 'white' }}
                />
                <input
                  value={cg.phone}
                  onChange={e => updateCaregiver(index, 'phone', e.target.value)}
                  placeholder="Phone number"
                  style={{ ...inputStyle, background: 'white', marginBottom: 0 }}
                />
              </div>
            ))}

            <div
              onClick={addCaregiver}
              style={{
                textAlign: 'center',
                color: '#20A090',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '12px 0'
              }}
            >
              + Add another person
            </div>
          </div>
        )}

        {/* Step 7 - Health conditions */}
        {step === 7 && !extraStep && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'black', marginBottom: 4 }}>
              Select{' '}
              <span style={{ color: '#20A090' }}>conditions</span>
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Select all that apply
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CONDITIONS.map(condition => {
                const selected = answers.health_conditions.includes(condition)
                return (
                  <div
                    key={condition}
                    onClick={() => toggleCondition(condition)}
                    style={optionStyle(selected)}
                  >
                    {condition}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom section */}
        <div style={{ padding: '16px 24px 0', position: 'relative' }}>

        {/* Warning */}
        {showWarning && (
            <div style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#E53E3E',
            marginBottom: 8,
            padding: '8px 16px',
            background: '#FFF5F5',
            borderRadius: 12,
            border: '1px solid #FED7D7'
            }}>
            Please answer before continuing
            </div>
        )}

        {/* Continue / Finish button */}
        <button
            onClick={isLastStep ? handleSubmit : next}
            disabled={submitting}
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
            cursor: 'pointer',
            marginBottom: 12,
            opacity: submitting ? 0.7 : 1
            }}
        >
            {submitting ? 'Saving...' : isLastStep ? 'Finish' : 'Continue'}
        </button>

        {/* Skip button */}
        <button
            onClick={() => navigate('/dashboard')}
            style={{
            background: 'none',
            border: 'none',
            textAlign: 'center',
            fontSize: 14,
            color: '#20A090',
            cursor: 'pointer',
            fontWeight: 500,
            fontFamily: 'Inter',
            width: '100%',
            padding: '8px 0',
            marginBottom: 0
            }}
        >
            Let's make this easy to use
        </button>

        {/* Dog with speech bubble */}
        <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginTop: 8,
            paddingBottom: 16,
            position: 'relative',
        }}>
            {/* Speech bubble */}
            <div style={{
            position: 'absolute',
            right: 110,
            bottom: 90,
            background: '#E8F8F5',
            borderRadius: 16,
            borderBottomRightRadius: 4,
            padding: '10px 14px',
            fontSize: 13,
            color: '#1a1a1a',
            fontFamily: 'Inter',
            whiteSpace: 'nowrap',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.08)'
            }}>
            I want to understand you better!
            {/* Bubble tail */}
            <div style={{
                position: 'absolute',
                bottom: -5,
                right: -8,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '0px solid transparent',
                borderTop: '8px solid #E8F8F5',
            }} />
            </div>

            {/* Dog image */}
            <img
            src="/OnboardingDog.png"
            alt="dog"
            style={{
                width: 150,
                height: 150,
                objectFit: 'contain',
            }}
            onError={e => { e.target.style.display = 'none' }}
            />
        </div>
    </div>
    </div>
  )
}