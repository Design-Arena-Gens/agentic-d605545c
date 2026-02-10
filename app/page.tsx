'use client'

import { useState, useEffect } from 'react'
import { Plus, Flame, Bell, Check, Trash2, Edit2, X } from 'lucide-react'

interface Habit {
  id: string
  name: string
  color: string
  streak: number
  lastCompleted: string | null
  completedDates: string[]
  reminder: string | null
  createdAt: string
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitColor, setNewHabitColor] = useState('#8b5cf6')
  const [newHabitReminder, setNewHabitReminder] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const colors = [
    '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#ef4444', '#06b6d4', '#f97316', '#a855f7', '#14b8a6'
  ]

  useEffect(() => {
    const stored = localStorage.getItem('habits')
    if (stored) {
      setHabits(JSON.parse(stored))
    }

    const notifStatus = localStorage.getItem('notificationsEnabled')
    setNotificationsEnabled(notifStatus === 'true')

    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    if (!notificationsEnabled) return

    const checkReminders = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      habits.forEach(habit => {
        if (habit.reminder && habit.reminder === currentTime) {
          const today = new Date().toISOString().split('T')[0]
          if (!habit.completedDates.includes(today)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Habit Reminder', {
                body: `Time to complete: ${habit.name}`,
                icon: '/icon-192.png',
                badge: '/icon-192.png'
              })
            }
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [habits, notificationsEnabled])

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        localStorage.setItem('notificationsEnabled', 'true')
      }
    }
  }

  const addHabit = () => {
    if (!newHabitName.trim()) return

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      color: newHabitColor,
      streak: 0,
      lastCompleted: null,
      completedDates: [],
      reminder: newHabitReminder || null,
      createdAt: new Date().toISOString()
    }

    setHabits([...habits, newHabit])
    setNewHabitName('')
    setNewHabitColor('#8b5cf6')
    setNewHabitReminder('')
    setShowAddModal(false)
  }

  const updateHabit = () => {
    if (!editingHabit || !newHabitName.trim()) return

    setHabits(habits.map(h =>
      h.id === editingHabit.id
        ? { ...h, name: newHabitName, color: newHabitColor, reminder: newHabitReminder || null }
        : h
    ))

    setEditingHabit(null)
    setNewHabitName('')
    setNewHabitColor('#8b5cf6')
    setNewHabitReminder('')
    setShowEditModal(false)
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id))
  }

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setNewHabitName(habit.name)
    setNewHabitColor(habit.color)
    setNewHabitReminder(habit.reminder || '')
    setShowEditModal(true)
  }

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0]

    setHabits(habits.map(habit => {
      if (habit.id !== id) return habit

      const isCompletedToday = habit.completedDates.includes(today)

      if (isCompletedToday) {
        return {
          ...habit,
          completedDates: habit.completedDates.filter(d => d !== today),
          streak: Math.max(0, habit.streak - 1),
          lastCompleted: habit.completedDates.length > 1
            ? habit.completedDates[habit.completedDates.length - 2]
            : null
        }
      } else {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const wasCompletedYesterday = habit.completedDates.includes(yesterdayStr)
        const newStreak = wasCompletedYesterday || habit.streak === 0 ? habit.streak + 1 : 1

        return {
          ...habit,
          completedDates: [...habit.completedDates, today].sort(),
          streak: newStreak,
          lastCompleted: today
        }
      }
    }))
  }

  const getTodayCompletion = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0]
    return habit.completedDates.includes(today)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20 safe-top safe-bottom">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Habit Tracker</h1>
            <p className="text-gray-600 text-sm mt-1">Build better habits, one day at a time</p>
          </div>
          {!notificationsEnabled && (
            <button
              onClick={requestNotifications}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <Bell size={20} className="text-purple-600" />
            </button>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4 text-gray-400">
              <Flame size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet</h3>
            <p className="text-gray-500 mb-6">Start tracking your first habit!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const isCompleted = getTodayCompletion(habit)

              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-105'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Check
                          size={28}
                          className={isCompleted ? 'text-white' : 'text-gray-400'}
                          strokeWidth={3}
                        />
                      </button>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{habit.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Flame size={16} style={{ color: habit.color }} />
                            <span className="text-sm font-bold" style={{ color: habit.color }}>
                              {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {habit.reminder && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Bell size={14} />
                              <span className="text-xs">{habit.reminder}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(habit)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">New Habit</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g., Drink water, Exercise, Read"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewHabitColor(color)}
                        className={`w-10 h-10 rounded-full transition-transform ${
                          newHabitColor === color ? 'scale-125 ring-4 ring-offset-2' : 'hover:scale-110'
                        }`}
                        style={{
                          backgroundColor: color
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Reminder (Optional)
                  </label>
                  <input
                    type="time"
                    value={newHabitReminder}
                    onChange={(e) => setNewHabitReminder(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={addHabit}
                  disabled={!newHabitName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Habit
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Habit</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewHabitColor(color)}
                        className={`w-10 h-10 rounded-full transition-transform ${
                          newHabitColor === color ? 'scale-125 ring-4 ring-offset-2' : 'hover:scale-110'
                        }`}
                        style={{
                          backgroundColor: color
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Reminder (Optional)
                  </label>
                  <input
                    type="time"
                    value={newHabitReminder}
                    onChange={(e) => setNewHabitReminder(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={updateHabit}
                  disabled={!newHabitName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Habit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
