// src/app/attendance-history/[employeeId]/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Footer from '@/components/footer'
import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
import { createClient } from '@supabase/supabase-js'
import NavbarDropdown from '@/app/Navbar/page'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  ChevronUp,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader,
  MapPin,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  UserMinus,
  Activity,
  Building,
  Filter,
  Phone,
  ArrowLeft,
  LogIn,
  LogOut
} from 'lucide-react'

// Import Roboto font
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
  father_name?: string
  cnic_number?: string
  phone_number?: string
  email?: string
  residential_address?: string
  joining_date?: string
  date_of_birth?: string
  marital_status?: string
  emergency_contact?: string
  source?: 'K' | 'PQ'
  enable_attendance?: boolean
  check_in?: Array<{
    time: string
    location: string
  }>
  check_out?: Array<{
    time: string
    location: string
  }>
}

interface AttendanceLog {
  id: number
  user_id: string
  employee_name: string
  timestamp: string
  punch_type: 'CHECK_IN' | 'CHECK_OUT' | null
  device_id: string
  branch_code: string
  raw_log_key: string
  created_at: string
  source?: 'K' | 'PQ'
}

interface AttendanceRecord {
  date: string
  day: string
  checkIn: string
  checkOut: string
  checkInTime: string
  checkOutTime: string
  totalHours: string
  checkInBranch: string
  checkOutBranch: string
  status: 'Present' | 'Absent' | 'Half Day'
  branch_code: string | null
  source?: 'K' | 'PQ'
  hasCheckIn: boolean
  hasCheckOut: boolean
  outsideCheckIn: string
  outsideCheckOut: string
  outsideTotalHours: string
  outsideCheckInTime: string
  outsideCheckOutTime: string
}

// ✅ Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ✅ Function to get branch display name
const getBranchDisplayName = (source: string | undefined) => {
  if (source === 'PQ') return 'Port Qasim'
  if (source === 'K') return 'Korangi'
  return 'Korangi'
}

export default function AttendanceHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDays: 0,
    attendanceRate: 0,
    totalWorkingDays: 0,
    totalRecords: 0
  })
  
  // Date range filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dataSource, setDataSource] = useState<{ K: number; PQ: number }>({ K: 0, PQ: 0 })
  
  // Mounted ref
  const isMounted = useRef(true)

  // =====================================================
  // formatDateForInput
  // =====================================================

  const formatDateForInput = useCallback((date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // =====================================================
  // getDayName
  // =====================================================

  const getDayName = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }, [])

  // =====================================================
  // formatTime
  // =====================================================

  const formatTime = useCallback((timestamp: string) => {
    if (!timestamp) return '-'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      })
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // formatDate
  // =====================================================

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // formatDateForDisplay
  // =====================================================

  const formatDateForDisplay = useCallback((dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // calculateTotalHours - First to Last timestamp
  // =====================================================

  const calculateTotalHours = useCallback((firstTime: string, lastTime: string) => {
    if (!firstTime || !lastTime) return '-'
    try {
      const inTime = new Date(firstTime)
      const outTime = new Date(lastTime)
      const diffMs = outTime.getTime() - inTime.getTime()
      
      if (diffMs < 3600000) return '-'
      if (diffMs < 0) return '-'
      
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // calculateOutsideHours - Calculate from Outside Check In/Out
  // =====================================================

  const calculateOutsideHours = useCallback((outsideCheckInTime: string, outsideCheckOutTime: string) => {
    if (!outsideCheckOutTime) return '-'
    if (!outsideCheckInTime) return '-'
    
    try {
      const inTime = new Date(outsideCheckInTime)
      const outTime = new Date(outsideCheckOutTime)
      
      const diffMs = outTime.getTime() - inTime.getTime()
      if (diffMs < 0) return '-'
      
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // calculateStats
  // =====================================================

  const calculateStats = useCallback((data: AttendanceRecord[]) => {
    const total = data.length
    const present = data.filter(r => r.status === 'Present').length
    const absent = data.filter(r => r.status === 'Absent').length
    const halfDay = data.filter(r => r.status === 'Half Day').length
    
    const workingDays = total
    const attendanceRate = workingDays > 0 ? ((present + halfDay * 0.5) / workingDays) * 100 : 0

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalHalfDays: halfDay,
      attendanceRate,
      totalWorkingDays: workingDays,
      totalRecords: total
    })
  }, [])

  // =====================================================
  // generateAttendanceData
  // =====================================================

  const generateAttendanceData = useCallback(() => {
    if (!employee || !fromDate || !toDate) {
      setAttendanceData([])
      setFilteredData([])
      calculateStats([])
      return
    }

    const startDate = new Date(fromDate + 'T00:00:00')
    const endDate = new Date(toDate + 'T00:00:00')
    const dateArray: string[] = []

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      dateArray.push(`${year}-${month}-${day}`)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const records: AttendanceRecord[] = []

    dateArray.forEach(date => {
      // Get all logs for this date
      const dayLogs = attendanceLogs.filter(log => {
        const logDate = log.timestamp.split('T')[0]
        return logDate === date
      })

      // Sort logs by timestamp (ascending)
      const sortedLogs = [...dayLogs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      let checkIn: AttendanceLog | null = null
      let checkOut: AttendanceLog | null = null
      let hasCheckIn = false
      let hasCheckOut = false

      // Process logs
      if (sortedLogs.length === 1) {
        const singleLog = sortedLogs[0]
        const logHour = new Date(singleLog.timestamp).getHours()
        
        if (logHour >= 18) {
          checkOut = singleLog
          hasCheckOut = true
          hasCheckIn = false
        } else {
          checkIn = singleLog
          hasCheckIn = true
          hasCheckOut = false
        }
      } else if (sortedLogs.length >= 2) {
        checkIn = sortedLogs[0]
        hasCheckIn = true
        
        const lastLog = sortedLogs[sortedLogs.length - 1]
        const diffMs = new Date(lastLog.timestamp).getTime() - new Date(checkIn.timestamp).getTime()
        
        if (diffMs >= 3600000) {
          checkOut = lastLog
          hasCheckOut = true
        } else {
          checkOut = null
          hasCheckOut = false
        }
      }

      // Determine status
      let status: 'Present' | 'Absent' | 'Half Day' = 'Absent'

      if (hasCheckIn && hasCheckOut) {
        status = 'Present'
      } else {
        status = 'Absent'
      }

      let source = employee.source || 'K'
      if (!employee.source) {
        source = checkIn?.source || checkOut?.source || 'K'
      }
      
      const branchCode = checkIn?.branch_code || checkOut?.branch_code || null

      // ✅ Get Outside Check In from employee's check_in JSON field
      let outsideCheckInTime = ''
      let outsideCheckOutTime = ''
      
      // Get first check-in from JSON for this date (Earliest In)
      if (employee.check_in && employee.check_in.length > 0) {
        const checkInJson = employee.check_in.find(c => {
          const cDate = c.time.split('T')[0]
          return cDate === date
        })
        if (checkInJson) {
          outsideCheckInTime = checkInJson.time
        }
      }
      
      // Get last check-out from JSON for this date (Latest Out)
      if (employee.check_out && employee.check_out.length > 0) {
        const checkOutJson = employee.check_out.find(c => {
          const cDate = c.time.split('T')[0]
          return cDate === date
        })
        if (checkOutJson) {
          outsideCheckOutTime = checkOutJson.time
        }
      }

      // ✅ Outside Check In - formatted time from JSON (or dash if empty)
      const outsideCheckIn = outsideCheckInTime ? formatTime(outsideCheckInTime) : '-'
      
      // ✅ Outside Check Out - formatted time from JSON (or dash if empty)
      const outsideCheckOut = outsideCheckOutTime ? formatTime(outsideCheckOutTime) : '-'
      
      // ✅ Outside Total Hours - calculate from Outside Check In/Out timestamps
      const outsideTotalHours = (outsideCheckInTime && outsideCheckOutTime) 
        ? calculateOutsideHours(outsideCheckInTime, outsideCheckOutTime)
        : '-'

      records.push({
        date: formatDate(date),
        day: getDayName(date),
        checkIn: checkIn ? formatTime(checkIn.timestamp) : '-',
        checkOut: checkOut ? formatTime(checkOut.timestamp) : '-',
        checkInTime: checkIn?.timestamp || '',
        checkOutTime: checkOut?.timestamp || '',
        totalHours: calculateTotalHours(
          checkIn?.timestamp || '',
          checkOut?.timestamp || ''
        ),
        checkInBranch: checkIn?.branch_code || '-',
        checkOutBranch: checkOut?.branch_code || '-',
        status,
        branch_code: branchCode,
        source: source as 'K' | 'PQ',
        hasCheckIn,
        hasCheckOut,
        outsideCheckIn: outsideCheckIn,
        outsideCheckOut: outsideCheckOut,
        outsideTotalHours: outsideTotalHours,
        outsideCheckInTime: outsideCheckInTime,
        outsideCheckOutTime: outsideCheckOutTime
      })
    })

    setAttendanceData(records)
    calculateStats(records)
  }, [employee, fromDate, toDate, attendanceLogs, formatDate, getDayName, formatTime, calculateTotalHours, calculateOutsideHours, calculateStats])

  // =====================================================
  // applyFilters
  // =====================================================

  const applyFilters = useCallback(() => {
    let filtered = [...attendanceData]

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => {
        if (selectedStatus === 'present') return record.status === 'Present'
        if (selectedStatus === 'absent') return record.status === 'Absent'
        if (selectedStatus === 'halfday') return record.status === 'Half Day'
        return true
      })
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(record =>
        record.date.toLowerCase().includes(term) ||
        record.day.toLowerCase().includes(term) ||
        record.status.toLowerCase().includes(term) ||
        record.checkInBranch.toLowerCase().includes(term) ||
        record.checkOutBranch.toLowerCase().includes(term)
      )
    }

    setFilteredData(filtered)
    calculateStats(filtered)
  }, [attendanceData, selectedStatus, searchTerm, calculateStats])

  // =====================================================
  // fetchEmployeeData
  // =====================================================

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId || !isMounted.current) return

    try {
      setLoading(true)
      setError(null)

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (employeeError) {
        throw new Error(employeeError.message)
      }

      if (!employeeData) {
        if (isMounted.current) {
          setError('Employee not found')
          setLoading(false)
        }
        return
      }

      const [mainLogsResult, pqLogsResult] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', employeeId)
          .order('timestamp', { ascending: true }),
        supabase
          .from('pq_attendance_logs')
          .select('*')
          .eq('user_id', employeeId)
          .order('timestamp', { ascending: true })
      ])

      if (mainLogsResult.error) {
        console.warn('Error fetching main attendance logs:', mainLogsResult.error)
      }

      if (pqLogsResult.error) {
        console.warn('Error fetching PQ attendance logs:', pqLogsResult.error)
      }

      let employeeSource: 'K' | 'PQ' = 'K'
      
      const hasPQLogs = (pqLogsResult.data?.length || 0) > 0
      const hasMainLogs = (mainLogsResult.data?.length || 0) > 0
      
      if (hasPQLogs) {
        employeeSource = 'PQ'
      } else if (hasMainLogs) {
        employeeSource = 'K'
      } else {
        employeeSource = 'K'
      }

      const allLogs: AttendanceLog[] = []

      if (mainLogsResult.data) {
        allLogs.push(...mainLogsResult.data.map((log: any) => ({
          ...log,
          punch_type: log.punch_type as 'CHECK_IN' | 'CHECK_OUT' | null,
          source: 'K' as 'K'
        })))
      }

      if (pqLogsResult.data) {
        allLogs.push(...pqLogsResult.data.map((log: any) => ({
          ...log,
          punch_type: log.punch_type as 'CHECK_IN' | 'CHECK_OUT' | null,
          source: 'PQ' as 'PQ'
        })))
      }

      allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      setDataSource({
        K: mainLogsResult.data?.length || 0,
        PQ: pqLogsResult.data?.length || 0
      })

      if (isMounted.current) {
        const transformedEmployee: Employee = {
          id: employeeData.id,
          employee_id: employeeData.employee_id,
          full_name: employeeData.full_name,
          department: employeeData.department || '',
          position: employeeData.position || '',
          father_name: employeeData.father_name || '',
          cnic_number: employeeData.cnic_number || '',
          phone_number: employeeData.phone_number || '',
          email: employeeData.email || '',
          residential_address: employeeData.residential_address || '',
          joining_date: employeeData.joining_date || '',
          date_of_birth: employeeData.date_of_birth || '',
          marital_status: employeeData.marital_status || '',
          emergency_contact: employeeData.emergency_contact || '',
          source: employeeSource,
          enable_attendance: employeeData.enable_attendance !== false,
          check_in: employeeData.check_in || [],
          check_out: employeeData.check_out || []
        }

        setEmployee(transformedEmployee)
        setAttendanceLogs(allLogs)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching employee data:', err)
      if (isMounted.current) {
        setError('Failed to load employee data')
        setLoading(false)
      }
    }
  }, [employeeId])

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    isMounted.current = true
    
    if (employeeId) {
      fetchEmployeeData()
    }
    
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFromDate(formatDateForInput(firstDay))
    setToDate(formatDateForInput(lastDay))
    
    return () => {
      isMounted.current = false
    }
  }, [employeeId, fetchEmployeeData, formatDateForInput])

  useEffect(() => {
    if (employee && fromDate && toDate) {
      generateAttendanceData()
    }
  }, [employee, fromDate, toDate, generateAttendanceData])

  useEffect(() => {
    applyFilters()
  }, [attendanceData, selectedStatus, searchTerm, applyFilters])

  // =====================================================
  // UI Helpers
  // =====================================================

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Present': return 'bg-green-100 text-green-700'
      case 'Absent': return 'bg-red-100 text-red-700'
      case 'Half Day': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Present': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Absent': return <XCircle className="w-4 h-4 text-red-600" />
      case 'Half Day': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  // =====================================================
  // Loading / Error / Not Found States
  // =====================================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold text-gray-800 mb-2 tracking-wider ${roboto.className}`}>
            Error
          </h3>
          <p className={`text-gray-600 mb-4 tracking-wide ${roboto.className}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider rounded ${roboto.className}`}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold text-gray-800 mb-2 tracking-wider ${roboto.className}`}>
            Employee Not Found
          </h3>
          <p className={`text-gray-600 tracking-wide ${roboto.className}`}>
            No employee found with ID: {employeeId}
          </p>
        </div>
      </div>
    )
  }

  const displayData = filteredData.length > 0 ? filteredData : attendanceData
  const isAttendanceEnabled = employee.enable_attendance !== false

  return (
    <>
      <ProtectedEmployeeRoute allowedRole='employee'>
        <NavbarDropdown />
        <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className={`text-3xl font-bold text-[#0071BD] tracking-wider ${roboto.className}`}>
                      Attendance History
                    </h1>
                  </div>
                </div>
                
                <div className="flex gap-3 items-center">
                  
                  <button
                    onClick={() => window.location.reload()}
                    className={`px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 tracking-wider rounded ${roboto.className}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${roboto.className}`}>
                  <User className="w-4 h-4 text-[#0071BD]" />
                  <span className={`font-medium tracking-wide ${roboto.className}`}>Employee</span>
                </div>
                <div className={`text-base font-semibold text-gray-800 mt-1 tracking-wide truncate ${roboto.className}`}>
                  {employee.full_name}
                </div>
                <div className={`text-xs text-gray-500 tracking-wide ${roboto.className}`}>
                  ID: {employee.employee_id}
                </div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${roboto.className}`}>
                  <Building className="w-4 h-4 text-[#0071BD]" />
                  <span className={`font-medium tracking-wide ${roboto.className}`}>Department</span>
                </div>
                <div className={`text-base font-semibold text-gray-800 mt-1 tracking-wide ${roboto.className}`}>
                  {employee.department || 'N/A'}
                </div>
                <div className={`text-xs text-gray-500 tracking-wide ${roboto.className}`}>
                  {employee.position || 'N/A'}
                </div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${roboto.className}`}>
                  <Phone className="w-4 h-4 text-[#0071BD]" />
                  <span className={`font-medium tracking-wide ${roboto.className}`}>Contact</span>
                </div>
                <div className={`text-base font-semibold text-gray-800 mt-1 tracking-wide ${roboto.className}`}>
                  {employee.phone_number || 'N/A'}
                </div>
                <div className={`text-xs text-gray-500 tracking-wide ${roboto.className}`}>
                  {employee.cnic_number || 'N/A'}
                </div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${roboto.className}`}>
                  <MapPin className="w-4 h-4 text-[#0071BD]" />
                  <span className={`font-medium tracking-wide ${roboto.className}`}>Branch</span>
                </div>
                <div className={` text-xl font-semibold mt-1 tracking-wide ${roboto.className} ${
                  employee.source === 'PQ' ? 'text-purple-700' : 'text-blue-700'
                }`}>
                  {getBranchDisplayName(employee.source)}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm text-[#0071BD] tracking-wide ${roboto.className}`}>Total</span>
                  <Calendar className="w-4 h-4 text-[#0071BD]" />
                </div>
                <div className={`text-2xl font-bold text-[#0071BD] tracking-wider mt-1 ${roboto.className}`}>
                  {stats.totalRecords}
                </div>
                <div className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>Records</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm text-green-600 tracking-wide ${roboto.className}`}>Present</span>
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className={`text-2xl font-bold text-green-700 tracking-wider mt-1 ${roboto.className}`}>
                  {stats.totalPresent}
                </div>
                <div className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>Days present</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm text-red-600 tracking-wide ${roboto.className}`}>Absent</span>
                  <UserX className="w-4 h-4 text-red-600" />
                </div>
                <div className={`text-2xl font-bold text-red-700 tracking-wider mt-1 ${roboto.className}`}>
                  {stats.totalAbsent}
                </div>
                <div className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>Days absent</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm text-yellow-600 tracking-wide ${roboto.className}`}>Half Days</span>
                  <Activity className="w-4 h-4 text-yellow-600" />
                </div>
                <div className={`text-2xl font-bold text-yellow-700 tracking-wider mt-1 ${roboto.className}`}>
                  {stats.totalHalfDays}
                </div>
                <div className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>Half days</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm text-purple-600 tracking-wide ${roboto.className}`}>Attendance Rate</span>
                  {stats.attendanceRate >= 75 ? 
                    <TrendingUp className="w-4 h-4 text-green-600" /> : 
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  }
                </div>
                <div className={`text-2xl font-bold tracking-wider mt-1 ${roboto.className} ${
                  stats.attendanceRate >= 75 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {stats.attendanceRate.toFixed(1)}%
                </div>
                <div className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>Overall rate</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white text-black shadow-sm p-4 mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 text-gray-700 hover:text-[#0071BD] transition tracking-wider ${roboto.className}`}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 tracking-wide mb-1 ${roboto.className}`}>
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value)
                          if (employee) generateAttendanceData()
                        }}
                        className={`w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide ${roboto.className}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 tracking-wide mb-1 ${roboto.className}`}>
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value)
                          if (employee) generateAttendanceData()
                        }}
                        className={`w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide ${roboto.className}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 tracking-wide mb-1 ${roboto.className}`}>
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide ${roboto.className}`}
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="halfday">Half Day</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 tracking-wide mb-1 ${roboto.className}`}>
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide ${roboto.className}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results Info */}
            <div className="bg-white shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#0071BD]" />
                  <span className={`font-medium text-gray-700 tracking-wide ${roboto.className}`}>
                    {displayData.length} attendance records found
                  </span>
                  
                  {selectedStatus !== 'all' && (
                    <span className={`px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wide ${roboto.className}`}>
                      Status: {selectedStatus}
                    </span>
                  )}
                  {(fromDate || toDate) && (
                    <span className={`px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wide ${roboto.className}`}>
                      {formatDateForDisplay(fromDate)} → {formatDateForDisplay(toDate)}
                    </span>
                  )}
                </div>
                <div className={`text-sm text-gray-500 tracking-wide ${roboto.className}`}>
                  Showing {displayData.length} of {attendanceData.length} total
                </div>
              </div>
            </div>

            {/* ✅ Attendance Table - Single Line with conditional columns */}
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#0071BD]" />
                  <h3 className={`text-sm font-semibold text-gray-800 tracking-wide ${roboto.className}`}>
                    Attendance Records
                  </h3>
                  <span className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>
                    {displayData.length} records
                  </span>
                  {(fromDate || toDate) && (
                    <span className={`text-xs text-[#0071BD] tracking-wide ${roboto.className}`}>
                      (Filtered: {formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)})
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>#</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Date</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Day</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Check In</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Check Out</th>
                      <th className={`px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${roboto.className}`}>Total Hours</th>
                      {/* ✅ OS Columns - Only show if enable_attendance is true */}
                      {isAttendanceEnabled && (
                        <>
                          <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${roboto.className}`}>OS Check In</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${roboto.className}`}>OS Check Out</th>
                          <th className={`px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${roboto.className}`}>Outside Hours</th>
                        </>
                      )}
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Branch</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${roboto.className}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayData.length === 0 ? (
                      <tr>
                        <td colSpan={isAttendanceEnabled ? 11 : 8} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="w-12 h-12 text-gray-300" />
                            <p className={`tracking-wide ${roboto.className}`}>No attendance records found</p>
                            <p className={`text-xs text-gray-400 tracking-wide ${roboto.className}`}>
                              Try adjusting your filters or search terms
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayData.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className={`px-4 py-3 text-sm text-gray-500 tracking-wide whitespace-nowrap ${roboto.className}`}>
                            {index + 1}
                          </td>
                          <td className={`px-4 py-3 text-sm text-gray-700 tracking-wide whitespace-nowrap ${roboto.className}`}>
                            {record.date}
                          </td>
                          <td className={`px-4 py-3 text-sm tracking-wide whitespace-nowrap ${roboto.className} ${record.day === 'Sunday' ? 'font-bold text-red-600' : 'text-gray-600'}`}>
                            {record.day}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.hasCheckIn ? (
                              <div className={`flex items-center gap-1.5 ${roboto.className}`}>
                                <LogIn className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                <span className={`text-sm font-medium text-gray-700 tracking-wide ${roboto.className}`}>
                                  {record.checkIn}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-sm text-gray-400 tracking-wide ${roboto.className}`}>-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.hasCheckOut ? (
                              <div className={`flex items-center gap-1.5 ${roboto.className}`}>
                                <LogOut className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span className={`text-sm font-medium text-gray-700 tracking-wide ${roboto.className}`}>
                                  {record.checkOut}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-sm text-gray-400 tracking-wide ${roboto.className}`}>-</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm text-center font-medium text-gray-800 tracking-wide whitespace-nowrap ${roboto.className}`}>
                            {record.totalHours}
                          </td>
                          {/* ✅ OS Columns - Only show if enable_attendance is true */}
                          {isAttendanceEnabled && (
                            <>
                              <td className={`px-4 py-3 text-sm text-gray-600 tracking-wide whitespace-nowrap ${roboto.className}`}>
                                {record.outsideCheckIn}
                              </td>
                              <td className={`px-4 py-3 text-sm text-gray-600 tracking-wide whitespace-nowrap ${roboto.className}`}>
                                {record.outsideCheckOut}
                              </td>
                              <td className={`px-4 py-3 text-sm text-center font-medium text-gray-800 tracking-wide whitespace-nowrap ${roboto.className}`}>
                                {record.outsideTotalHours}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold tracking-wide rounded-full ${roboto.className} ${
                              employee.source === 'PQ' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {getBranchDisplayName(employee.source)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium tracking-wide rounded-full ${roboto.className} ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            {displayData.length > 0 && (
              <div className="mt-6 bg-white shadow-sm p-4">
                <div className={`flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wide ${roboto.className}`}>
                  <div className={`tracking-wide ${roboto.className}`}>
                    Showing {displayData.length} records for {employee.full_name}
                    {(fromDate || toDate) && ` (${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)})`}
                  </div>
                  <div className={`flex flex-wrap items-center gap-4 ${roboto.className}`}>
                    <span className={`flex items-center gap-2 tracking-wide ${roboto.className}`}>
                      <span className="w-3 h-3 bg-green-500 rounded"></span>
                      Present: {stats.totalPresent}
                    </span>
                    <span className={`flex items-center gap-2 tracking-wide ${roboto.className}`}>
                      <span className="w-3 h-3 bg-red-500 rounded"></span>
                      Absent: {stats.totalAbsent}
                    </span>
                    <span className={`flex items-center gap-2 tracking-wide ${roboto.className}`}>
                      <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                      Half Days: {stats.totalHalfDays}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </ProtectedEmployeeRoute>
    </>
  )
}