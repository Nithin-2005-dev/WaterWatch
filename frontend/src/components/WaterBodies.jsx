import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { EnvironmentStore } from '@/store/EnvironmentsStore'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const parameters = [
  { key: 'ph', label: 'pH', unit: '', tip: 'Measure the pH level using a portable pH meter or pH test strips dipped into the waterbody.', validate: val => val >= 0 && val <= 14, errorMsg: 'Enter a valid pH between 0 and 14' },
  { key: 'Hardness', label: 'Hardness (mg/L)', unit: 'mg/L', tip: 'Test water hardness using a hardness test kit or digital water tester.', validate: val => val > 0, errorMsg: 'Hardness must be a positive number' },
  { key: 'Solids', label: 'Total Dissolved Solids (TDS)', unit: 'ppm', tip: 'Use a TDS meter to measure solids dissolved in water.', validate: val => val > 0, errorMsg: 'TDS must be a positive number' },
  { key: 'Chloramines', label: 'Chloramines (ppm)', unit: 'ppm', tip: 'Measure chloramines using a water test kit specific for disinfectants.', validate: val => val >= 0, errorMsg: 'Chloramines cannot be negative' },
  { key: 'Sulfate', label: 'Sulfate (mg/L)', unit: 'mg/L', tip: 'Use sulfate test strips or kits to check sulfate concentration.', validate: val => val >= 0, errorMsg: 'Sulfate cannot be negative' },
  { key: 'Conductivity', label: 'Conductivity (µS/cm)', unit: 'µS/cm', tip: 'Use a conductivity meter to measure water’s ability to conduct electricity.', validate: val => val > 0, errorMsg: 'Conductivity must be positive' },
  { key: 'Organic_carbon', label: 'Organic Carbon (ppm)', unit: 'ppm', tip: 'Test organic carbon using water quality test kits or lab analysis.', validate: val => val >= 0, errorMsg: 'Organic carbon cannot be negative' },
  { key: 'Trihalomethanes', label: 'Trihalomethanes (µg/L)', unit: 'µg/L', tip: 'Measure THMs via specialized water analysis kits or labs.', validate: val => val >= 0, errorMsg: 'Trihalomethanes cannot be negative' },
  { key: 'Turbidity', label: 'Turbidity (NTU)', unit: 'NTU', tip: 'Measure turbidity with a turbidity meter or Secchi disk.', validate: val => val >= 0, errorMsg: 'Turbidity cannot be negative' },
]

const WaterBodies = () => {
  const { currEnvironments, getEnvironments } = useContext(EnvironmentStore)
  const [openReadingEnvId, setOpenReadingEnvId] = useState(null)
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEnv, setNewEnv] = useState({ name: '', location: '' ,userId:"68452e3a837ff10bf4c35b0f"})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getEnvironments()
  }, [])

  const param = parameters[step]

  const handleChange = (e) => {
    const val = e.target.value
    setValues((v) => ({ ...v, [param.key]: val }))
    if (error) setError('')
  }

  const handleNext = async () => {
    const valNum = parseFloat(values[param.key])
    if (!param.validate(valNum)) {
      setError(param.errorMsg)
      return
    }

    if (step === parameters.length - 1) {
      try {
        const predictionPayload = {}
        parameters.forEach(({ key }) => {
          predictionPayload[key] = parseFloat(values[key])
        })

        const predictionRes = await axios.post(
          'http://127.0.0.1:5000/predict',
          predictionPayload
        )
        const isSafe = predictionRes.data.prediction[0] === 1

        const res = await axios.put(
          `/api/environment/updateEnvironment/${openReadingEnvId}`,
          {
            status: isSafe ? 'safe' : 'unsafe',
            readings: predictionPayload,
          }
        )

        const updatedEnv = res.data.environment
        const latestSuggestion =
          updatedEnv.recommandations[updatedEnv.recommandations.length - 1]

        toast.info(
          `💧 Status: ${isSafe ? 'Safe ✅' : 'Unsafe ❌'}\n💡 Suggestion: ${latestSuggestion}`,
          { autoClose: 4000 }
        )

        await axios.post('/api/waterReadings/addWaterReadings', {
          environment: openReadingEnvId,
          prediction: isSafe,
          ...predictionPayload,
        })
        setTimeout(() => {
          window.location.reload()
        }, 5000)
      } catch (err) {
        console.error(err)
        toast.error('Failed to submit readings. Please try again.')
      }
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const startReading = (envId) => {
    if (openReadingEnvId === envId) {
      setOpenReadingEnvId(null)
      setStep(0)
      setValues({})
      setError('')
    } else {
      setOpenReadingEnvId(envId)
      setStep(0)
      setValues({})
      setError('')
    }
  }

  const handleAddEnvironment = async () => {
    if (newEnv.name.length < 3 || newEnv.name.length > 50) {
      setFormError('Name must be 3–50 characters')
      return
    }
    if (!newEnv.location || newEnv.location.length > 100) {
      setFormError('Location is required and must be under 100 characters')
      return
    }

    try {
      const res = await axios.post('/api/environment/createEnvironment', newEnv)
      toast.success('Environment added successfully!')
      setShowAddModal(false)
      setNewEnv({ name: '', location: '' })
      getEnvironments()
    } catch (err) {
      toast.error('Failed to add environment.')
      console.error(err)
    }
  }

  return (
    <section className="flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />

      <button
        onClick={() => setShowAddModal(true)}
        className="px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-lg transition-all duration-300 float-right my-2 w-fit self-end"
      >
        + Add Environment
      </button>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Environment</h2>
            <input
              type="text"
              placeholder="Environment Name"
              value={newEnv.name}
              onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
              className="w-full mb-3 p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Location"
              value={newEnv.location}
              onChange={(e) => setNewEnv({ ...newEnv, location: e.target.value })}
              className="w-full mb-3 p-3 border rounded-lg"
            />
            {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEnvironment}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 justify-center w-full items-center my-3">
        {currEnvironments &&
          currEnvironments.map((env) => (
            <div
              key={env._id}
              className="bg-white bg-opacity-70 backdrop-blur-md rounded-2xl shadow-xl w-3/4 p-8 border border-gray-200"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-wide drop-shadow-sm">
                {env.name}
              </h2>

              <div className="space-y-4 text-gray-700">
                <p><span className="font-semibold">Location:</span> {env.location}</p>
                <p>
                  <span className="font-semibold">Previous Suggestion:</span>{' '}
                  <span className="text-green-600 font-medium">
                    {env.recommandations[env.recommandations.length - 1]}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="text-green-700 font-bold">{env.status}</span>
                </p>
              </div>

              <div className="mt-8 flex gap-6">
                <Link
                  to={`/analytics/${env._id}`}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 rounded-xl font-semibold shadow-lg transition-transform transform hover:scale-105 text-center"
                >
                  View Analytics
                </Link>

                <button
                  onClick={() => startReading(env._id)}
                  className={`flex-1 ${
                    openReadingEnvId === env._id
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800'
                  } text-white py-3 rounded-xl font-semibold shadow-lg transition-transform transform hover:scale-105`}
                >
                  {openReadingEnvId === env._id ? 'Cancel Reading' : 'Add Readings'}
                </button>
              </div>

              {openReadingEnvId === env._id && (
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-blue-300">
                  <h3 className="text-xl font-bold mb-4 text-blue-700">
                    Add Water Reading ({step + 1} / {parameters.length})
                  </h3>

                  <label htmlFor={param.key} className="block text-lg font-semibold mb-2 text-gray-700">
                    {param.label}{' '}
                    {param.unit && <span className="text-sm text-gray-400">({param.unit})</span>}
                  </label>
                  <input
                    id={param.key}
                    type="number"
                    step="any"
                    value={values[param.key] || ''}
                    onChange={handleChange}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      error ? 'border-red-500 animate-shake' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2`}
                  />
                  {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

                  <div className="bg-blue-50 rounded-md p-3 mb-4 text-blue-800 text-sm italic">
                    <strong>How to measure:</strong> {param.tip}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={handleBack}
                      disabled={step === 0}
                      className={`px-5 py-2 rounded-lg font-semibold ${
                        step === 0
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } transition`}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-5 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      {step === parameters.length - 1 ? 'Submit' : 'Next'}
                    </button>
                  </div>

                  <div className="flex justify-center space-x-2 mt-5">
                    {parameters.map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          i === step ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <style>{`
                    @keyframes shake {
                      10%, 90% { transform: translateX(-1px); }
                      20%, 80% { transform: translateX(2px); }
                      30%, 50%, 70% { transform: translateX(-4px); }
                      40%, 60% { transform: translateX(4px); }
                    }
                    .animate-shake {
                      animation: shake 0.4s;
                    }
                  `}</style>
                </div>
              )}
            </div>
          ))}
      </div>
    </section>
  )
}

export default WaterBodies
