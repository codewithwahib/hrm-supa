// components/AttendancePopup.tsx
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Clock,
  AlertCircle,
  Play,
  X,
} from 'lucide-react'
import { Roboto } from 'next/font/google'
import { createClient } from '@supabase/supabase-js'

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TodayAttendance {
  hasCheckIn: boolean
  hasCheckOut: boolean
  checkInTime: string | null
  checkOutTime: string | null
  checkInLocation: string | null
  checkOutLocation: string | null
  totalHours: number
  isCurrentlyCheckedIn: boolean
}

interface AttendancePopupProps {
  employeeId: string
  autoShow?: boolean
}

// ============================================
// STATUS PALETTE
// One accent per state — used for the pill, the
// clock's second hand and the outer ring only.
// ============================================
const STATUS_STYLES = {
  in: { ring: '#1F9D55', dot: '#1F9D55', text: '#166534', bg: '#EDF9F1', label: 'Checked in' },
  out: { ring: '#0071BD', dot: '#0071BD', text: '#0B4E80', bg: '#EAF4FB', label: 'Checked out' },
  partial: { ring: '#C9822E', dot: '#C9822E', text: '#8A5A1E', bg: '#FBF1E5', label: 'Missing check-out' },
  none: { ring: '#9AA3AE', dot: '#9AA3AE', text: '#5B6470', bg: '#F3F4F6', label: 'Not checked in' },
} as const

// ============================================
// ANALOG CLOCK
// A plain, legible wall clock. The dial stays
// classic black-on-white; only the second hand
// and rim carry the day's status color.
// ============================================
function AnalogClock({ now, accent }: { now: Date; accent: string }) {
  const hours = now.getHours() % 12
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  const secondAngle = seconds * 6
  const minuteAngle = minutes * 6 + seconds * 0.1
  const hourAngle = hours * 30 + minutes * 0.5

  const cx = 100
  const cy = 100

  const hand = (angle: number, length: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    }
  }

  const hourTip = hand(hourAngle, 44)
  const minuteTip = hand(minuteAngle, 66)
  const secondTip = hand(secondAngle, 76)

  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i
    const angle = i * 30
    const pos = hand(angle, 72)
    return { n, x: pos.x, y: pos.y }
  })

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isMajor = i % 5 === 0
    const inner = hand(i * 6, isMajor ? 82 : 87)
    const outer = hand(i * 6, 91)
    return { inner, outer, isMajor }
  })

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label="Current time">
      <circle cx={cx} cy={cy} r={96} fill="none" stroke={accent} strokeWidth="3" opacity="0.9" />
      <circle cx={cx} cy={cy} r={91} fill="#FFFFFF" stroke="#1A1D22" strokeWidth="4" />

      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.inner.x}
          y1={t.inner.y}
          x2={t.outer.x}
          y2={t.outer.y}
          stroke="#1A1D22"
          strokeWidth={t.isMajor ? 2.5 : 1}
          opacity={t.isMajor ? 1 : 0.45}
          strokeLinecap="round"
        />
      ))}

      {numerals.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="15"
          fontWeight={700}
          fill="#1A1D22"
        >
          {n}
        </text>
      ))}

      <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y} stroke="#1A1D22" strokeWidth="5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minuteTip.x} y2={minuteTip.y} stroke="#1A1D22" strokeWidth="3.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={secondTip.x} y2={secondTip.y} stroke={accent} strokeWidth="1.5" strokeLinecap="round" />

      <circle cx={cx} cy={cy} r={5} fill="#1A1D22" />
      <circle cx={cx} cy={cy} r={2} fill={accent} />
    </svg>
  )
}

export default function AttendancePopup({
  employeeId,
  autoShow = true,
}: AttendancePopupProps) {
  // ============================================
  // STATES
  // ============================================
  const [isOpen, setIsOpen] = useState(false)
  const [employee, setEmployee] = useState<any>(null)
  const [attendance, setAttendance] = useState<TodayAttendance>({
    hasCheckIn: false,
    hasCheckOut: false,
    checkInTime: null,
    checkOutTime: null,
    checkInLocation: null,
    checkOutLocation: null,
    totalHours: 0,
    isCurrentlyCheckedIn: false,
  })
  const [logsCount, setLogsCount] = useState(0)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [now, setNow] = useState(new Date())
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  const popupRef = useRef<HTMLDivElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================
  // FORMAT FUNCTIONS
  // ============================================

  const formatDisplayTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--:--'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    } catch {
      return '--:--:--'
    }
  }

  const formatTimeDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  // ============================================
  // STATUS
  // ============================================

  const statusKey: keyof typeof STATUS_STYLES = attendance.isCurrentlyCheckedIn
    ? 'in'
    : attendance.hasCheckOut
    ? 'out'
    : attendance.hasCheckIn
    ? 'partial'
    : 'none'

  const status = STATUS_STYLES[statusKey]

  // ============================================
  // FETCH DATA - FAST WITH PARALLEL QUERIES
  // ============================================

  const fetchData = useCallback(async () => {
    if (!employeeId) return

    try {
      // Auto show popup immediately
      if (autoShow) {
        setIsOpen(true)
      }

      // Parallel queries for faster loading
      const [employeeResult, mainLogsResult, pqLogsResult] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle(),
        supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', employeeId)
          .order('timestamp', { ascending: true }),
        supabase
          .from('pq_attendance_logs')
          .select('*')
          .eq('user_id', employeeId)
          .order('timestamp', { ascending: true }),
      ])

      if (employeeResult.error) throw new Error(employeeResult.error.message)
      if (!employeeResult.data) throw new Error('Employee not found')

      const employeeData = employeeResult.data
      setEmployee(employeeData)

      // Combine logs
      let allLogs: any[] = []
      if (mainLogsResult.data) allLogs = [...allLogs, ...mainLogsResult.data]
      if (pqLogsResult.data) allLogs = [...allLogs, ...pqLogsResult.data]

      allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      // Today's logs
      const today = new Date().toISOString().split('T')[0]
      const todayLogs = allLogs.filter((log) => log.timestamp.split('T')[0] === today)
      setLogsCount(todayLogs.length)

      // Calculate attendance
      const sortedLogs = [...todayLogs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      let checkIn: any = null
      let checkOut: any = null
      let hasCheckIn = false
      let hasCheckOut = false

      if (sortedLogs.length === 1) {
        const singleLog = sortedLogs[0]
        const logHour = new Date(singleLog.timestamp).getHours()
        if (logHour >= 18) {
          checkOut = singleLog
          hasCheckOut = true
        } else {
          checkIn = singleLog
          hasCheckIn = true
        }
      } else if (sortedLogs.length >= 2) {
        checkIn = sortedLogs[0]
        hasCheckIn = true
        const lastLog = sortedLogs[sortedLogs.length - 1]
        const diffMs = new Date(lastLog.timestamp).getTime() - new Date(checkIn.timestamp).getTime()
        if (diffMs >= 3600000) {
          checkOut = lastLog
          hasCheckOut = true
        }
      }

      // Fallback to employee JSON
      if (!hasCheckIn && !hasCheckOut) {
        const checkIns = employeeData.check_in || []
        const checkOuts = employeeData.check_out || []

        const todayCheckIns = checkIns.filter((c: any) => c.time.split('T')[0] === today)
        const todayCheckOuts = checkOuts.filter((c: any) => c.time.split('T')[0] === today)

        if (todayCheckIns.length > 0) {
          hasCheckIn = true
          checkIn = todayCheckIns[0]
        }
        if (todayCheckOuts.length > 0) {
          hasCheckOut = true
          checkOut = todayCheckOuts[todayCheckOuts.length - 1]
        }
      }

      let totalHours = 0
      let isCurrentlyCheckedIn = false

      if (hasCheckIn && checkIn) {
        const inTime = new Date(checkIn.timestamp || checkIn.time).getTime()
        if (hasCheckOut && checkOut) {
          const outTime = new Date(checkOut.timestamp || checkOut.time).getTime()
          totalHours = (outTime - inTime) / (1000 * 60 * 60)
          isCurrentlyCheckedIn = false
        } else {
          const nowTime = new Date().getTime()
          totalHours = (nowTime - inTime) / (1000 * 60 * 60)
          isCurrentlyCheckedIn = true
        }
      }

      const attendanceResult = {
        hasCheckIn,
        hasCheckOut,
        checkInTime: checkIn?.timestamp || checkIn?.time || null,
        checkOutTime: checkOut?.timestamp || checkOut?.time || null,
        checkInLocation: checkIn?.location || checkIn?.branch_code || null,
        checkOutLocation: checkOut?.location || checkOut?.branch_code || null,
        totalHours,
        isCurrentlyCheckedIn,
      }

      setAttendance(attendanceResult)

      // START TIMER IF CHECKED IN
      if (isCurrentlyCheckedIn && checkIn) {
        const inTime = new Date(checkIn.timestamp || checkIn.time).getTime()
        const nowTime = new Date().getTime()
        const elapsedSeconds = Math.floor((nowTime - inTime) / 1000)

        setElapsedTime(formatTimeDuration(elapsedSeconds))

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

        timerIntervalRef.current = setInterval(() => {
          setElapsedTime((prevTime) => {
            const currentSeconds = parseTimeToSeconds(prevTime)
            return formatTimeDuration(currentSeconds + 1)
          })
        }, 1000)
      } else if (hasCheckOut && totalHours > 0) {
        setElapsedTime(formatTimeDuration(totalHours * 3600))
      } else {
        setElapsedTime('00:00:00')
      }

      setDataLoaded(true)
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError(err instanceof Error ? err.message : 'Failed to load attendance')
    }
  }, [employeeId, autoShow])

  // ============================================
  // EFFECT - FETCH ONCE
  // ============================================

  useEffect(() => {
    fetchData()

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  // ============================================
  // EFFECT - LIVE CLOCK FACE (always ticking,
  // independent of check-in state)
  // ============================================

  useEffect(() => {
    clockIntervalRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current)
        clockIntervalRef.current = null
      }
    }
  }, [])

  // ============================================
  // CLOSE HANDLERS
  // ============================================

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  // ============================================
  // RENDER - ERROR
  // ============================================

  if (error) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E13]/60 backdrop-blur-sm ${roboto.className}`}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
          <AlertCircle className="w-10 h-10 text-[#C9822E] mx-auto" />
          <p className={`text-[15px] text-[#3A3F47] mt-4 leading-relaxed tracking-wider ${roboto.className}`}>
            {error}
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className={`mt-6 w-full py-3 bg-[#0071BD] text-white rounded-xl font-medium hover:bg-[#005a96] transition tracking-wider ${roboto.className}`}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER - CLOSED
  // ============================================

  if (!isOpen) return null

  // ============================================
  // RENDER - POPUP
  // ============================================

  let totalHoursDisplay = '--:--:--'
  if (attendance.hasCheckIn) {
    totalHoursDisplay = attendance.hasCheckOut ? formatTimeDuration(attendance.totalHours * 3600) : elapsedTime
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0E13]/60 backdrop-blur-sm ${roboto.className}`}>
      <div
        ref={popupRef}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto"
      >
        {/* Header with Cross on Right Side */}
        <div className="flex justify-end px-6 pt-6">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="p-1.5 hover:bg-[#F3F4F6] rounded-full transition"
          >
            <X className="w-5 h-5 text-[#5B6470]" />
          </button>
        </div>

        {/* Clock hero */}
        <div className="flex justify-center py-7">
          <div className="w-52 h-52">
            <AnalogClock now={now} accent={status.ring} />
          </div>
        </div>

        {/* Check-in / Timer / Check-out row */}
        <div className="grid grid-cols-3 border-t border-[#EEF0F2] mx-6">
          <div className="text-center py-4 border-r border-[#EEF0F2] pr-2">
            <div className={`text-[15px] font-bold text-[#1A1D22] tabular-nums tracking-wider ${roboto.className}`}>
              {attendance.hasCheckIn ? formatDisplayTime(attendance.checkInTime) : '--:--:--'}
            </div>
            <div className={`text-[11px] text-[#9AA3AE] mt-1 tracking-wider ${roboto.className}`}>
              Check-in time
            </div>
          </div>
          <div className="text-center py-4 border-r border-[#EEF0F2] px-2">
            <div
              className={`text-[15px] font-bold tabular-nums tracking-wider ${roboto.className}`}
              style={{ color: attendance.isCurrentlyCheckedIn ? status.ring : '#1A1D22' }}
            >
              {totalHoursDisplay}
            </div>
            <div className={`text-[11px] text-[#9AA3AE] mt-1 tracking-wider ${roboto.className}`}>
              Hours
            </div>
          </div>
          <div className="text-center py-4 pl-2">
            <div className={`text-[15px] font-bold text-[#1A1D22] tabular-nums tracking-wider ${roboto.className}`}>
              {attendance.hasCheckOut ? formatDisplayTime(attendance.checkOutTime) : '--:--:--'}
            </div>
            <div className={`text-[11px] text-[#9AA3AE] mt-1 tracking-wider ${roboto.className}`}>
              Check-out time
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}