'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Target, TrendingUp, DollarSign, Users, Zap } from 'lucide-react'

interface Goal {
  id: string
  text: string
  category: string
}

const categories = [
  { name: 'Growth', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#3B82F6' },
  { name: 'Revenue', icon: <DollarSign className="w-3.5 h-3.5" />, color: '#10B981' },
  { name: 'Engagement', icon: <Users className="w-3.5 h-3.5" />, color: '#8B5CF6' },
  { name: 'Efficiency', icon: <Zap className="w-3.5 h-3.5" />, color: '#F59E0B' },
]

const suggestedGoals: Array<{ text: string; category: string }> = [
  { text: 'Achieve 10% week-over-week user growth', category: 'Growth' },
  { text: 'Reach $50K MRR within 12 months', category: 'Revenue' },
  { text: 'Maintain 90%+ monthly active user retention', category: 'Engagement' },
  { text: 'Reduce average task completion time by 50%', category: 'Efficiency' },
  { text: 'Launch MVP within 8 weeks', category: 'Efficiency' },
  { text: 'Achieve NPS score of 50+', category: 'Engagement' },
]

interface StepGoalsProps {
  goals: Goal[]
  onChange: (goals: Goal[]) => void
}

export default function StepGoals({ goals, onChange }: StepGoalsProps) {
  const [newGoalText, setNewGoalText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Growth')

  const addGoal = () => {
    if (!newGoalText.trim()) return
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      text: newGoalText.trim(),
      category: selectedCategory,
    }
    onChange([...goals, newGoal])
    setNewGoalText('')
  }

  const removeGoal = (id: string) => {
    onChange(goals.filter((g) => g.id !== id))
  }

  const addSuggestedGoal = (suggestion: { text: string; category: string }) => {
    const exists = goals.some((g) => g.text === suggestion.text)
    if (exists) return
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      text: suggestion.text,
      category: suggestion.category,
    }
    onChange([...goals, newGoal])
  }

  const categoryColor = (cat: string) => {
    return categories.find((c) => c.name === cat)?.color || '#8B5CF6'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">What are your goals?</h2>
        <p className="text-[#94A3B8] text-sm">
          Define measurable goals that will guide your product decisions and help you track success.
        </p>
      </div>

      {/* Add Goal Form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Enter a goal..."
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addGoal()
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addGoal}
            className="px-4 py-2 bg-[#8B5CF6] text-white text-sm font-medium rounded-lg hover:bg-[#8B5CF6]/90 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>

        {/* Category selector */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                selectedCategory === cat.name
                  ? 'border-transparent text-white'
                  : 'border-white/[0.08] text-[#64748B] hover:text-[#94A3B8]'
              }`}
              style={selectedCategory === cat.name ? { backgroundColor: cat.color + '20', color: cat.color, borderColor: cat.color + '40' } : {}}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-2">
        <AnimatePresence>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 group hover:border-white/[0.12] transition-colors"
            >
              <Target className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: categoryColor(goal.category) }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F1F5F9]">{goal.text}</p>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ backgroundColor: categoryColor(goal.category) + '15', color: categoryColor(goal.category) }}
                >
                  {goal.category}
                </span>
              </div>
              <button
                onClick={() => removeGoal(goal.id)}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/[0.05] transition-all"
              >
                <X className="w-3.5 h-3.5 text-[#64748B]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Suggested Goals */}
      <div className="space-y-2">
        <p className="text-xs text-[#64748B] font-medium">Suggested goals</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedGoals
            .filter((sg) => !goals.some((g) => g.text === sg.text))
            .map((sg, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => addSuggestedGoal(sg)}
                className="text-left bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl px-3 py-2.5 hover:border-[#8B5CF6]/30 hover:bg-white/[0.03] transition-all group"
              >
                <p className="text-xs text-[#64748B] group-hover:text-[#94A3B8] transition-colors">{sg.text}</p>
                <span className="text-[10px] text-[#64748B]/60 mt-0.5 inline-block">{sg.category}</span>
              </motion.button>
            ))}
        </div>
      </div>
    </div>
  )
}
