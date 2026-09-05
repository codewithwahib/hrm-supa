// components/EmployeeTimeTracker.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Timer, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader,
  Calendar,
  MapPin,
  Navigation
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Roboto font import
import { Roboto } from 'next/font/google'
const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface EmployeeTimeTrackerProps {
  employeeId: string
  employeeName: string
  employeeSource?: 'K' | 'PQ'
  onCheckIn?: (data: CheckInData) => void
  onCheckOut?: (data: CheckOutData) => void
  onStatusChange?: (status: 'checked-in' | 'checked-out') => void
}

interface CheckInData {
  employeeId: string
  employeeName: string
  checkInTime: string
  location: string
  source: string
  branchCode: string
}

interface CheckOutData {
  employeeId: string
  employeeName: string
  checkOutTime: string
  totalHours: string
  totalSeconds: number
  location: string
  source: string
  branchCode: string
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmployeeTimeTracker({
  employeeId,
  employeeName,
  employeeSource = 'K',
  onCheckIn,
  onCheckOut,
  onStatusChange
}: EmployeeTimeTrackerProps) {
  const [status, setStatus] = useState<'checked-in' | 'checked-out'>('checked-out')
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isTracking, setIsTracking] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [location, setLocation] = useState<string>('')
  const [autoCheckOutTimer, setAutoCheckOutTimer] = useState<NodeJS.Timeout | null>(null)
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  
  // Today's date
  const today = new Date().toISOString().split('T')[0]
  const isMounted = useRef(true)

  // Format time as HH:MM:SS
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }, [])

  // Get current location
  const getCurrentLocation = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('Location not available')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        },
        () => {
          resolve('Location not available')
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    })
  }, [])

  // ✅ Check if user already checked in today from Supabase
  const checkTodayAttendance = useCallback(async () => {
    try {
      // Check in attendance_logs
      const { data: mainLogs, error: mainError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', employeeId)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: true })

      if (mainError) {
        console.warn('Error fetching main logs:', mainError)
      }

      // Check in pq_attendance_logs
      const { data: pqLogs, error: pqError } = await supabase
        .from('pq_attendance_logs')
        .select('*')
        .eq('user_id', employeeId)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: true })

      if (pqError) {
        console.warn('Error fetching PQ logs:', pqError)
      }

      const allLogs = [...(mainLogs || []), ...(pqLogs || [])]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      setTodayLogs(allLogs)

      if (allLogs.length > 0) {
        // Check if last log is CHECK_IN (no CHECK_OUT after it)
        const lastLog = allLogs[allLogs.length - 1]
        
        // Check if there's a CHECK_OUT for today
        const hasCheckOut = allLogs.some(log => 
          log.punch_type === 'CHECK_OUT'
        )

        // If last log is CHECK_IN and there's no CHECK_OUT
        if (lastLog.punch_type === 'CHECK_IN' && !hasCheckOut) {
          setStatus('checked-in')
          setCheckInTime(lastLog.timestamp)
          setElapsedTime(Math.floor((Date.now() - new Date(lastLog.timestamp).getTime()) / 1000))
          setIsTracking(true)
          
          if (onStatusChange) {
            onStatusChange('checked-in')
          }
          
          // Setup auto check-out if checked in
          setupAutoCheckOut()
          return true
        }
        
        // If there's a CHECK_OUT, user is checked out
        if (hasCheckOut) {
          const checkOutLog = allLogs.filter(log => 
            log.punch_type === 'CHECK_OUT'
          ).pop()
          
          if (checkOutLog) {
            setCheckOutTime(checkOutLog.timestamp)
          }
          setStatus('checked-out')
          setIsTracking(false)
          
          if (onStatusChange) {
            onStatusChange('checked-out')
          }
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error('Error checking today attendance:', error)
      return false
    }
  }, [employeeId, today, onStatusChange])

  // ✅ Auto check-out at midnight
  const setupAutoCheckOut = useCallback(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0) // Next midnight
    
    const timeUntilMidnight = midnight.getTime() - now.getTime()
    
    if (timeUntilMidnight > 0) {
      const timer = setTimeout(() => {
        handleAutoCheckOut()
      }, timeUntilMidnight)
      
      setAutoCheckOutTimer(timer)
    }
  }, [])

  // ✅ Auto check-out handler
  const handleAutoCheckOut = useCallback(async () => {
    if (status === 'checked-in' && checkInTime) {
      console.log('🔄 Auto check-out triggered at midnight')
      
      const now = new Date()
      const checkInDate = new Date(checkInTime)
      const totalSeconds = Math.floor((now.getTime() - checkInDate.getTime()) / 1000)
      const totalHours = formatTime(totalSeconds)

      // Save auto check-out to Supabase
      try {
        const tableName = employeeSource === 'PQ' ? 'pq_attendance_logs' : 'attendance_logs'
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            user_id: employeeId,
            employee_name: employeeName,
            timestamp: now.toISOString(),
            punch_type: 'CHECK_OUT',
            device_id: 'web-app-auto',
            branch_code: employeeSource,
            raw_log_key: `auto-${employeeId}-${now.getTime()}`,
            created_at: now.toISOString()
          })

        if (insertError) {
          console.error('Error auto check-out:', insertError)
        }
      } catch (err) {
        console.error('Auto check-out error:', err)
      }

      const checkOutData: CheckOutData = {
        employeeId,
        employeeName,
        checkOutTime: now.toISOString(),
        totalHours: totalHours,
        totalSeconds: totalSeconds,
        location: 'Auto check-out at midnight',
        source: employeeSource,
        branchCode: employeeSource
      }

      if (onCheckOut) {
        await onCheckOut(checkOutData)
      }

      setStatus('checked-out')
      setCheckOutTime(now.toISOString())
      setElapsedTime(totalSeconds)
      setIsTracking(false)
      setSuccessMessage(`🔄 Auto check-out at midnight | Total Time: ${totalHours}`)
      
      if (onStatusChange) {
        onStatusChange('checked-out')
      }
      
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [status, checkInTime, employeeId, employeeName, employeeSource, onCheckOut, formatTime, onStatusChange])

  // ✅ Handle Check In
  const handleCheckIn = useCallback(async () => {
    if (status === 'checked-in') {
      setError('You are already checked in!')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Check if already checked in today
      const existingCheckIn = await checkTodayAttendance()
      if (existingCheckIn) {
        setError('You have already checked in today!')
        setIsLoading(false)
        return
      }

      // Get current location
      const currentLocation = await getCurrentLocation()

      const now = new Date()
      
      // Determine which table to use
      const tableName = employeeSource === 'PQ' ? 'pq_attendance_logs' : 'attendance_logs'
      
      // Save to Supabase
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          user_id: employeeId,
          employee_name: employeeName,
          timestamp: now.toISOString(),
          punch_type: 'CHECK_IN',
          device_id: 'web-app',
          branch_code: employeeSource,
          raw_log_key: `web-${employeeId}-${now.getTime()}`,
          created_at: now.toISOString()
        })

      if (insertError) {
        throw new Error('Failed to save check-in to database')
      }

      const checkInData: CheckInData = {
        employeeId,
        employeeName,
        checkInTime: now.toISOString(),
        location: currentLocation,
        source: employeeSource,
        branchCode: employeeSource
      }

      if (onCheckIn) {
        await onCheckIn(checkInData)
      }

      setStatus('checked-in')
      setCheckInTime(now.toISOString())
      setElapsedTime(0)
      setLocation(currentLocation)
      setIsTracking(true)
      setSuccessMessage(`✅ Checked in successfully at ${formatDate(now.toISOString())}`)
      
      if (onStatusChange) {
        onStatusChange('checked-in')
      }

      // Setup auto check-out at midnight
      setupAutoCheckOut()

      setTimeout(() => setSuccessMessage(null), 5000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in. Please try again.')
      console.error('Check-in error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [status, employeeId, employeeName, employeeSource, onCheckIn, onStatusChange, getCurrentLocation, formatDate, checkTodayAttendance, setupAutoCheckOut])

  // ✅ Handle Check Out
  const handleCheckOut = useCallback(async () => {
    if (status === 'checked-out') {
      setError('You are already checked out!')
      return
    }

    if (!checkInTime) {
      setError('No check-in record found. Please check in first.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const currentLocation = await getCurrentLocation()

      const now = new Date()
      const checkInDate = new Date(checkInTime)
      const totalSeconds = Math.floor((now.getTime() - checkInDate.getTime()) / 1000)
      const totalHours = formatTime(totalSeconds)

      // Determine which table to use
      const tableName = employeeSource === 'PQ' ? 'pq_attendance_logs' : 'attendance_logs'

      // Save to Supabase
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          user_id: employeeId,
          employee_name: employeeName,
          timestamp: now.toISOString(),
          punch_type: 'CHECK_OUT',
          device_id: 'web-app',
          branch_code: employeeSource,
          raw_log_key: `web-${employeeId}-${now.getTime()}`,
          created_at: now.toISOString()
        })

      if (insertError) {
        throw new Error('Failed to save check-out to database')
      }

      const checkOutData: CheckOutData = {
        employeeId,
        employeeName,
        checkOutTime: now.toISOString(),
        totalHours: totalHours,
        totalSeconds: totalSeconds,
        location: currentLocation,
        source: employeeSource,
        branchCode: employeeSource
      }

      if (onCheckOut) {
        await onCheckOut(checkOutData)
      }

      // Clear auto check-out timer
      if (autoCheckOutTimer) {
        clearTimeout(autoCheckOutTimer)
        setAutoCheckOutTimer(null)
      }

      setStatus('checked-out')
      setCheckOutTime(now.toISOString())
      setLocation(currentLocation)
      setElapsedTime(totalSeconds)
      setIsTracking(false)
      setSuccessMessage(`✅ Checked out successfully at ${formatDate(now.toISOString())} | Total Time: ${totalHours}`)
      
      if (onStatusChange) {
        onStatusChange('checked-out')
      }

      setTimeout(() => setSuccessMessage(null), 5000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out. Please try again.')
      console.error('Check-out error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [status, checkInTime, employeeId, employeeName, employeeSource, onCheckOut, onStatusChange, getCurrentLocation, formatTime, formatDate, autoCheckOutTimer])

  // Start tracking elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (status === 'checked-in' && checkInTime) {
      setIsTracking(true)
      const startTime = new Date(checkInTime).getTime()
      
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = (now - startTime) / 1000
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      setIsTracking(false)
      if (interval) {
        clearInterval(interval)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [status, checkInTime])

  // ✅ Check today's attendance on mount
  useEffect(() => {
    isMounted.current = true
    
    const init = async () => {
      await checkTodayAttendance()
    }
    
    init()

    return () => {
      isMounted.current = false
      if (autoCheckOutTimer) {
        clearTimeout(autoCheckOutTimer)
      }
    }
  }, [checkTodayAttendance])

  const getStatusColor = () => {
    if (status === 'checked-in') {
      return 'bg-green-100 text-green-700 border-green-300'
    }
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getStatusIcon = () => {
    if (status === 'checked-in') {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    return <XCircle className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-auto ${roboto.className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Timer className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-wider">
              Time Tracker
            </h2>
            <p className="text-xs text-gray-500 tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" />
              {employeeName}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{status === 'checked-in' ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Time Display */}
      <div className="text-center mb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Session</span>
          </div>
          <div className="text-4xl font-bold font-mono text-gray-800 tracking-wider">
            {status === 'checked-in' ? formatTime(elapsedTime) : '--:--:--'}
          </div>
          {status === 'checked-in' && checkInTime && (
            <p className="text-xs text-gray-400 mt-1">
              Started: {formatDate(checkInTime)}
            </p>
          )}
          {status === 'checked-out' && checkOutTime && (
            <p className="text-xs text-gray-400 mt-1">
              Ended: {formatDate(checkOutTime)}
            </p>
          )}
        </div>
      </div>

      {/* Check-in/Check-out Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleCheckIn}
          disabled={status === 'checked-in' || isLoading}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            status === 'checked-in' || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }`}
        >
          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {isLoading ? 'Processing...' : 'Check In'}
        </button>

        <button
          onClick={handleCheckOut}
          disabled={status === 'checked-out' || isLoading || !checkInTime}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            status === 'checked-out' || isLoading || !checkInTime
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
          }`}
        >
          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {isLoading ? 'Processing...' : 'Check Out'}
        </button>
      </div>

      {/* Details Section */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Session Details</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Check In</span>
            <span className="font-medium text-gray-700">
              {checkInTime ? formatDate(checkInTime) : '--'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Check Out</span>
            <span className="font-medium text-gray-700">
              {checkOutTime ? formatDate(checkOutTime) : '--'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-500">Total Hours</span>
            <span className="font-bold text-blue-600">
              {status === 'checked-out' && checkOutTime ? formatTime(elapsedTime) : 
               status === 'checked-in' ? formatTime(elapsedTime) : '--:--:--'}
            </span>
          </div>

          {location && (
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-700 text-xs truncate max-w-[150px]">
                {location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Auto Check-out Info */}
      {status === 'checked-in' && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Auto check-out at 12:00 AM midnight
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-400 tracking-wider">
        <p>ID: {employeeId} • {status === 'checked-in' ? 'Currently Active' : 'Ready to Start'}</p>
        <p className="text-[10px] text-gray-300 mt-1">Today: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}