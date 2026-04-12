'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Palette } from 'lucide-react'

const PRODUCT_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#F43F5E', '#6366F1', '#14B8A6', '#F97316',
]

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Kolkata', 'Asia/Shanghai', 'Australia/Sydney',
]

export function GeneralSettings() {
  const [name, setName] = useState('Product OS')
  const [description, setDescription] = useState(
    'A unified product intelligence and execution system for modern product teams.'
  )
  const [slug, setSlug] = useState('product-os')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [timezone, setTimezone] = useState('America/New_York')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-2xl"
    >
      {/* Product Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#E2E8F0]">
          Product Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#E2E8F0]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors resize-none"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#E2E8F0]">
          Product Slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#475569]">app.productos.dev/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors"
          />
        </div>
      </div>

      {/* Icon/Color selector */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-[#E2E8F0]">
          <Palette size={14} className="text-[#64748B]" />
          Product Color
        </label>
        <div className="flex items-center gap-2.5">
          {PRODUCT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-lg transition-all ${
                selectedColor === color
                  ? 'ring-2 ring-offset-2 ring-offset-[#0a0f1e] scale-110'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: color,
                ringColor: selectedColor === color ? color : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: selectedColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-[#64748B]">Preview of product icon</span>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#E2E8F0]">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors appearance-none cursor-pointer"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} className="bg-[#0f1629] text-[#F1F5F9]">
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
        >
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  )
}
