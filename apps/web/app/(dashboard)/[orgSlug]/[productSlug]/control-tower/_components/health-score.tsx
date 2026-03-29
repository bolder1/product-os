'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { Heart } from 'lucide-react'
import { useParams } from 'next/navigation'
import { calculateReadinessScore } from '../../../../../lib/validation-engine'

function useLiveHealthData() {
  const params = useParams()
  const productId = params?.orgSlug && params?.productSlug
    ? `${params.orgSlug}-${params.productSlug}`
    : ''
  const readiness = useMemo(() => calculateReadinessScore(productId), [productId])
  const hasRealData = readiness.overall > 0

  return hasRealData
    ? {
        score: readiness.overall,
        breakdown: [
          { label: 'Plan', value: readiness.plan },
          { label: 'Brand', value: readiness.brand },
          { label: 'Components', value: readiness.components },
          { label: 'Design', value: readiness.design },
        ],
      }
    : {
        score: 78,
        breakdown: [
          { label: 'Completeness', value: 85 },
          { label: 'Quality', value: 72 },
          { label: 'Velocity', value: 80 },
          { label: 'Risk', value: 75 },
        ],
      }
}

function getScoreColor(score: number) {
  if (score > 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#F43F5E'
}

export function HealthScore() {
  const healthData = useLiveHealthData()
  const [displayScore, setDisplayScore] = useState(0)
  const motionScore = useMotionValue(0)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = useTransform(
    motionScore,
    [0, 100],
    [circumference, circumference * (1 - healthData.score / 100)]
  )

  useEffect(() => {
    const controls = animate(motionScore, healthData.score, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return controls.stop
  }, [motionScore, healthData.score])

  const color = getScoreColor(healthData.score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col items-center gap-5 h-full"
    >
      <div className="flex items-center gap-2 self-start">
        <Heart className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">
          Product Health
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="10"
          />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold text-[#F1F5F9]">{displayScore}</span>
          <span className="text-xs text-[#64748B]">/ 100</span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        {healthData.breakdown.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">{item.label}</span>
              <span className="text-xs font-medium text-[#F1F5F9]">{item.value}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(item.value) }}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
