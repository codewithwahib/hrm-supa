// app/hr/get-sheet/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createClient } from '@supabase/supabase-js'
import NavbarDropdown from '@/components/navbar'
import {
  RefreshCw,
  Calendar,
  Users,
  Building,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Loader,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus,
  Printer,
  MapPin,
  AlertCircle,
  Palette,
  FileText,
  LogIn,
  LogOut,
  Clock
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
  emergency_contact?: string
  date_of_birth?: string
  marital_status?: string
  residential_address?: string
  joining_date?: string
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
  qualifications?: Array<{
    degree: string
    institution: string
    year: string
    grade: string
  }>
  experience?: Array<{
    company: string
    position: string
    fromDate: string
    toDate: string
    description: string
  }>
  leaves?: Array<{
    fromDate: string
    toDate: string
    status: string
    leaveType: string
    reason?: string
    totalDays?: number
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
  employeeId: string
  name: string
  fatherName: string
  cnic: string
  phoneNumber: string
  emergencyContact: string
  dob: string
  maritalStatus: string
  address: string
  department: string
  designation: string
  joiningDate: string
  date: string
  day: string
  checkIn: string
  checkOut: string
  checkInTime: string
  checkOutTime: string
  totalHours: string
  checkInLocation: string
  checkOutLocation: string
  status: 'Present' | 'Absent' | 'Leave' | 'Half Day'
  leaveType?: string
  leaveReason?: string
  qualifications: string
  experience: string
  isOnLeave: boolean
  hasCheckIn: boolean
  hasCheckOut: boolean
  outsideCheckIn: string
  outsideCheckOut: string
  outsideTotalHours: string
  outsideCheckInTime: string
  outsideCheckOutTime: string
  branch: string
  branchCode: 'K' | 'PQ'
}

// ✅ Supabase client - MOVED OUTSIDE component (created once)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Function to get branch display name
const getBranchDisplayName = (source: string | undefined) => {
  if (source === 'PQ') return 'Port Qasim'
  if (source === 'K') return 'Korangi'
  return 'Korangi'
}

export default function GetSheetPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [expandedFilters, setExpandedFilters] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [employeeNames, setEmployeeNames] = useState<{id: string, name: string, department: string, source: string}[]>([])
  const [showPrintOptions, setShowPrintOptions] = useState(false)
  const [dataSource, setDataSource] = useState<{ K: number; PQ: number }>({ K: 0, PQ: 0 })
  
  // Branch filter
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [branches, setBranches] = useState<string[]>(['K', 'PQ'])
  
  const isMounted = useRef(true)

  // =====================================================
  // Helper Functions
  // =====================================================

  const getDayName = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }, [])

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

  const calculateTotalHours = useCallback((checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '-'
    try {
      const inTime = new Date(checkIn)
      const outTime = new Date(checkOut)
      const diffMs = outTime.getTime() - inTime.getTime()
      
      if (diffMs < 0) return '-'
      
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      const formattedHours = String(hours).padStart(2, '0')
      const formattedMinutes = String(minutes).padStart(2, '0')
      const formattedSeconds = String(seconds).padStart(2, '0')
      
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    } catch {
      return '-'
    }
  }, [])

  // =====================================================
  // calculateOutsideHours
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

  const getQualificationsString = useCallback((qualifications: any[] = []) => {
    if (!qualifications || qualifications.length === 0) return '-'
    return qualifications.map(q => 
      `${q.degree} (${q.institution}, ${q.year}) - ${q.grade}`
    ).join('; ')
  }, [])

  const getExperienceString = useCallback((experience: any[] = []) => {
    if (!experience || experience.length === 0) return '-'
    return experience.map(exp => 
      `${exp.position} at ${exp.company}`
    ).join('; ')
  }, [])

  const isValidCoordinate = useCallback((location: string): boolean => {
    if (!location || location === '-') return false
    const parts = location.split(',').map(s => s.trim())
    if (parts.length !== 2) return false
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }, [])

  const parseCoordinates = useCallback((location: string): { lat: number; lng: number } | null => {
    if (!location || location === '-') return null
    const parts = location.split(',').map(s => s.trim())
    if (parts.length !== 2) return null
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lng)) return null
    return { lat, lng }
  }, [])

  const openGoogleMaps = useCallback((location: string) => {
    const coords = parseCoordinates(location)
    if (!coords) {
      const searchQuery = encodeURIComponent(location)
      window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank')
      return
    }
    window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')
  }, [parseCoordinates])

  // =====================================================
  // getEmployeeAttendance - UPDATED WITH OS AND CHECK IN/OUT
  // =====================================================

  const getEmployeeAttendance = useCallback((employee: Employee, date: string, logs: AttendanceLog[]): AttendanceRecord => {
    const dateStr = date
    
    // Get logs from attendance_logs for this employee and date
    const dayLogs = logs.filter(log => {
      const logDate = log.timestamp.split('T')[0]
      return logDate === dateStr && log.user_id === employee.employee_id
    })

    const sortedLogs = [...dayLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let checkInLog: AttendanceLog | null = null
    let checkOutLog: AttendanceLog | null = null
    let hasCheckIn = false
    let hasCheckOut = false

    // Process logs
    if (sortedLogs.length === 1) {
      const singleLog = sortedLogs[0]
      const logHour = new Date(singleLog.timestamp).getHours()
      
      if (logHour >= 18) {
        checkOutLog = singleLog
        hasCheckOut = true
        hasCheckIn = false
      } else {
        checkInLog = singleLog
        hasCheckIn = true
        hasCheckOut = false
      }
    } else if (sortedLogs.length >= 2) {
      checkInLog = sortedLogs[0]
      hasCheckIn = true
      
      const lastLog = sortedLogs[sortedLogs.length - 1]
      const diffMs = new Date(lastLog.timestamp).getTime() - new Date(checkInLog.timestamp).getTime()
      
      if (diffMs >= 3600000) {
        checkOutLog = lastLog
        hasCheckOut = true
      } else {
        checkOutLog = null
        hasCheckOut = false
      }
    }

    // Check for leave
    const leave = employee.leaves?.find(
      l => l.fromDate <= dateStr && l.toDate >= dateStr && l.status === 'approved'
    )

    let status: 'Present' | 'Absent' | 'Leave' | 'Half Day' = 'Absent'
    let leaveType = ''
    let leaveReason = ''
    let isOnLeave = false

    if (leave) {
      status = 'Leave'
      leaveType = leave.leaveType || ''
      leaveReason = leave.reason || ''
      isOnLeave = true
    } else if (hasCheckIn && hasCheckOut) {
      status = 'Present'
    } else if (hasCheckIn && !hasCheckOut) {
      status = 'Half Day'
    }

    // ✅ Get Outside Check In from employee's check_in JSON field
    let outsideCheckInTime = ''
    let outsideCheckOutTime = ''
    
    if (employee.check_in && employee.check_in.length > 0) {
      const checkInJson = employee.check_in.find(c => {
        const cDate = c.time.split('T')[0]
        return cDate === dateStr
      })
      if (checkInJson) {
        outsideCheckInTime = checkInJson.time
      }
    }
    
    if (employee.check_out && employee.check_out.length > 0) {
      const checkOutJson = employee.check_out.find(c => {
        const cDate = c.time.split('T')[0]
        return cDate === dateStr
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

    const displayCheckIn = isOnLeave ? '-' : (checkInLog ? formatTime(checkInLog.timestamp) : '-')
    const displayCheckOut = isOnLeave ? '-' : (checkOutLog ? formatTime(checkOutLog.timestamp) : '-')
    const displayTotalHours = isOnLeave ? '-' : calculateTotalHours(checkInLog?.timestamp || '', checkOutLog?.timestamp || '')
    const displayCheckInLocation = isOnLeave ? '-' : (checkInLog?.branch_code || '-')
    const displayCheckOutLocation = isOnLeave ? '-' : (checkOutLog?.branch_code || '-')

    // Determine branch
    let source = employee.source || 'K'
    if (!employee.source) {
      source = checkInLog?.source || checkOutLog?.source || 'K'
    }

    const branch = getBranchDisplayName(source)

    return {
      employeeId: employee.employee_id || '',
      name: employee.full_name || '',
      fatherName: employee.father_name || '-',
      cnic: employee.cnic_number || '-',
      phoneNumber: employee.phone_number || '-',
      emergencyContact: employee.emergency_contact || '-',
      dob: formatDate(employee.date_of_birth || ''),
      maritalStatus: employee.marital_status || '-',
      address: employee.residential_address || '-',
      department: employee.department || '',
      designation: employee.position || '',
      joiningDate: formatDate(employee.joining_date || ''),
      date: formatDate(dateStr),
      day: getDayName(dateStr),
      checkIn: displayCheckIn,
      checkOut: displayCheckOut,
      checkInTime: checkInLog?.timestamp || '',
      checkOutTime: checkOutLog?.timestamp || '',
      totalHours: displayTotalHours,
      checkInLocation: displayCheckInLocation,
      checkOutLocation: displayCheckOutLocation,
      status,
      leaveType,
      leaveReason,
      qualifications: getQualificationsString(employee.qualifications),
      experience: getExperienceString(employee.experience),
      isOnLeave,
      hasCheckIn,
      hasCheckOut,
      outsideCheckIn: outsideCheckIn,
      outsideCheckOut: outsideCheckOut,
      outsideTotalHours: outsideTotalHours,
      outsideCheckInTime: outsideCheckInTime,
      outsideCheckOutTime: outsideCheckOutTime,
      branch: branch,
      branchCode: source as 'K' | 'PQ'
    }
  }, [formatDate, getDayName, formatTime, calculateTotalHours, calculateOutsideHours, getQualificationsString, getExperienceString])

  // =====================================================
  // getSelectedEmployeeName
  // =====================================================

  const getSelectedEmployeeName = useCallback(() => {
    if (selectedEmployee === 'all') return 'All Employees'
    const emp = employees.find(e => e.employee_id === selectedEmployee)
    return emp?.full_name || 'Selected Employee'
  }, [employees, selectedEmployee])

  // =====================================================
  // getRowColor
  // =====================================================

  const getRowColor = useCallback((checkInTime: string, day: string, isOnLeave: boolean) => {
    if (isOnLeave) return 'transparent'
    
    if (day === 'Sunday') return '#FFCCCC'
    
    if (!checkInTime || checkInTime === '-') return 'transparent'
    
    try {
      const timeStr = checkInTime.replace(/\s/g, '')
      const isPM = timeStr.includes('PM')
      let hours = parseInt(timeStr.split(':')[0])
      const minutes = parseInt(timeStr.split(':')[1]?.replace(/[AP]M/g, ''))
      
      if (isPM && hours !== 12) hours += 12
      if (!isPM && hours === 12) hours = 0
      
      const totalMinutes = hours * 60 + (minutes || 0)
      
      if (totalMinutes < 600) {
        return '#4A90D9'
      } else if (totalMinutes >= 600 && totalMinutes < 630) {
        return '#27AE60'
      } else if (totalMinutes >= 630 && totalMinutes < 690) {
        return '#F1C40F'
      } else if (totalMinutes >= 690) {
        return '#E74C3C'
      }
      
      return 'transparent'
    } catch {
      return 'transparent'
    }
  }, [])

  // =====================================================
  // LocationDisplay
  // =====================================================

  const LocationDisplay = useCallback(({ location, label }: { location: string; label: string }) => {
    if (!location || location === '-') {
      return <span className="text-gray-400">-</span>
    }

    const hasCoords = isValidCoordinate(location)
    const displayText = hasCoords ? '📍' : location.length > 15 ? location.substring(0, 15) + '...' : location

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openGoogleMaps(location)}
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 text-[10px] transition-colors"
          title={location}
        >
          <MapPin className="w-2.5 h-2.5" />
          <span>{displayText}</span>
        </button>
      </div>
    )
  }, [isValidCoordinate, openGoogleMaps])

  // =====================================================
  // fetchData
  // =====================================================

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return

    try {
      setLoading(true)
      setError(null)

      // Fetch employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true })

      if (employeeError) {
        throw new Error(employeeError.message)
      }

      if (!employeeData || employeeData.length === 0) {
        setError('No employees found')
        setEmployees([])
        setDepartments([])
        setLoading(false)
        return
      }

      const employeeIds = employeeData.map((e: any) => e.employee_id)

      // Fetch attendance logs from both tables
      const [mainLogsResult, pqLogsResult] = await Promise.all([
        supabase
          .from('attendance_logs')
          .select('*')
          .in('user_id', employeeIds)
          .order('timestamp', { ascending: true }),
        supabase
          .from('pq_attendance_logs')
          .select('*')
          .in('user_id', employeeIds)
          .order('timestamp', { ascending: true })
      ])

      if (mainLogsResult.error) {
        console.warn('Error fetching main attendance logs:', mainLogsResult.error)
      }

      if (pqLogsResult.error) {
        console.warn('Error fetching PQ attendance logs:', pqLogsResult.error)
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

      // Determine source for each employee
      const employeesWithSource = employeeData.map((emp: any) => {
        const hasPQLogs = allLogs.some(log => log.user_id === emp.employee_id && log.source === 'PQ')
        const hasMainLogs = allLogs.some(log => log.user_id === emp.employee_id && log.source === 'K')
        
        let source: 'K' | 'PQ' = 'K'
        if (hasPQLogs) {
          source = 'PQ'
        } else if (hasMainLogs) {
          source = 'K'
        }
        
        return { ...emp, source }
      })

      setDataSource({
        K: mainLogsResult.data?.length || 0,
        PQ: pqLogsResult.data?.length || 0
      })

      // Extract departments
      const depts = employeesWithSource
        .map((emp: any) => emp.department)
        .filter(Boolean) as string[]
      setDepartments([...new Set(depts)])

      // Extract branches
      const branchList = employeesWithSource
        .map((emp: any) => emp.source)
        .filter(Boolean) as string[]
      setBranches([...new Set(branchList)])

      // Extract employee names with source
      const names = employeesWithSource
        .map((emp: any) => ({
          id: emp.employee_id || '',
          name: emp.full_name || '',
          department: emp.department || '',
          source: emp.source || 'K'
        }))
        .filter((n: any) => n.id && n.name)
      setEmployeeNames(names)

      setEmployees(employeesWithSource)
      setAttendanceLogs(allLogs)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
      setLoading(false)
    }
  }, [])

  // =====================================================
  // generateAttendanceSheet
  // =====================================================

  const generateAttendanceSheet = useCallback(() => {
    if (!fromDate || !toDate || employees.length === 0) return

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

    let allRecords: AttendanceRecord[] = []

    let filteredEmployees = employees
    
    if (selectedDepartment !== 'all') {
      filteredEmployees = filteredEmployees.filter(
        emp => emp.department === selectedDepartment
      )
    }
    
    if (selectedBranch !== 'all') {
      filteredEmployees = filteredEmployees.filter(
        emp => emp.source === selectedBranch
      )
    }
    
    if (selectedEmployee !== 'all') {
      filteredEmployees = filteredEmployees.filter(
        emp => emp.employee_id === selectedEmployee
      )
    }

    filteredEmployees.forEach(employee => {
      dateArray.forEach(date => {
        const record = getEmployeeAttendance(employee, date, attendanceLogs)
        allRecords.push(record)
      })
    })

    setAttendanceData(allRecords)
    setFilteredData(allRecords)
  }, [employees, fromDate, toDate, selectedDepartment, selectedBranch, selectedEmployee, attendanceLogs, getEmployeeAttendance])

  // =====================================================
  // getSummary
  // =====================================================

  const getSummary = useCallback(() => {
    const total = filteredData.length
    const present = filteredData.filter(r => r.status === 'Present').length
    const absent = filteredData.filter(r => r.status === 'Absent').length
    const leave = filteredData.filter(r => r.status === 'Leave').length
    const halfDay = filteredData.filter(r => r.status === 'Half Day').length

    return { total, present, absent, leave, halfDay }
  }, [filteredData])

  // =====================================================
  // handlePrint
  // =====================================================

  const handlePrintWithColor = useCallback((withColor: boolean) => {
    setShowPrintOptions(false)
    
    const data = filteredData
    const employeeName = selectedEmployee === 'all' ? 'All Employees' : getSelectedEmployeeName()
    const deptName = selectedDepartment !== 'all' ? selectedDepartment : 'All Departments'
    const branchName = selectedBranch !== 'all' ? getBranchDisplayName(selectedBranch) : 'All Branches'

    const getRowColorForPrint = (record: AttendanceRecord) => {
      if (!withColor) return 'transparent'
      return getRowColor(record.checkIn, record.day, record.isOnLeave)
    }

    let tableRows = ''
    data.forEach((record, index) => {
      const isSunday = record.day === 'Sunday'
      const rowColor = getRowColorForPrint(record)
      const bgStyle = rowColor !== 'transparent' ? `background-color: ${rowColor};` : ''
      
      tableRows += `
        <tr style="${bgStyle}">
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${index + 1}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.employeeId}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.name}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.department}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.designation}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.date}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif; ${isSunday ? 'font-weight: bold; color: #FF0000;' : ''}">${record.day}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.checkIn}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.checkOut}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.totalHours}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.checkInLocation}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.checkOutLocation}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.outsideCheckIn}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.outsideCheckOut}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.outsideTotalHours}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.branch}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.status}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.leaveType || '-'}</td>
          <td style="padding: 2px 3px; border: 1px solid #000; font-size: 7px; text-align: center; font-family: 'Roboto', Arial, sans-serif;">${record.leaveReason || '-'}</td>
        </tr>
      `
    })

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Sheet - ${employeeName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 5mm 4mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Roboto', Arial, Helvetica, sans-serif;
              background: white;
              color: #000000;
              padding: 0;
              margin: 0;
            }
            .print-container {
              width: 100%;
              padding: 0;
            }
            .print-header {
              text-align: center;
              margin-bottom: 6px;
              padding-bottom: 5px;
              border-bottom: 2px solid #000000;
            }
            .print-header .company-name {
              font-size: 11px;
              font-weight: 700;
              color: #000000;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-family: 'Roboto', Arial, sans-serif;
            }
            .print-header .title {
              font-size: 10px;
              font-weight: 700;
              color: #000000;
              margin-top: 1px;
              letter-spacing: 0.5px;
              font-family: 'Roboto', Arial, sans-serif;
            }
            .print-header .sub-info {
              font-size: 7px;
              color: #000000;
              margin-top: 2px;
              font-weight: 500;
              font-family: 'Roboto', Arial, sans-serif;
            }
            .print-header .date-range {
              font-size: 7px;
              color: #000000;
              margin-top: 1px;
              font-weight: 400;
              font-family: 'Roboto', Arial, sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              margin-top: 2px;
            }
            table thead th {
              background: #C4BD97;
              font-weight: 700;
              text-align: center;
              padding: 3px 2px;
              border: 1px solid #000000;
              text-transform: uppercase;
              font-size: 6px;
              letter-spacing: 0.2px;
              color: #000000;
              white-space: nowrap;
              font-family: 'Roboto', Arial, sans-serif;
            }
            table tbody td {
              padding: 2px 3px;
              border: 1px solid #000000;
              color: #000000;
              vertical-align: middle;
              text-align: center;
              font-size: 7px;
              font-family: 'Roboto', Arial, sans-serif;
            }
            .print-footer {
              margin-top: 6px;
              padding-top: 4px;
              border-top: 1px solid #000000;
              text-align: center;
              font-size: 6px;
              color: #000000;
              letter-spacing: 0.3px;
              font-family: 'Roboto', Arial, sans-serif;
            }
            .print-footer .footer-text {
              font-weight: 400;
              font-family: 'Roboto', Arial, sans-serif;
            }
            @media print {
              body { 
                padding: 0; 
                margin: 0;
              }
              .print-container {
                padding: 0;
              }
              table thead th {
                background: #C4BD97 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              tr[style*="background-color"] td {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              tr[style*="background-color"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <div class="company-name">A to Zee Switchgear Engineering (SMC) Pvt. Ltd.</div>
              <div class="title">EMPLOYEE ATTENDANCE SHEET</div>
              <div class="sub-info">${employeeName} | ${deptName} | ${branchName}</div>
              <div class="date-range">${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(toDate)}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width:1%">#</th>
                  <th style="width:2%">Emp ID</th>
                  <th style="width:5%">Name</th>
                  <th style="width:3%">Dept</th>
                  <th style="width:4%">Designation</th>
                  <th style="width:3%">Date</th>
                  <th style="width:3%">Day</th>
                  <th style="width:3%">Check In</th>
                  <th style="width:3%">Check Out</th>
                  <th style="width:3%">Hours</th>
                  <th style="width:3%">In Location</th>
                  <th style="width:3%">Out Location</th>
                  <th style="width:3%">OS Check In</th>
                  <th style="width:3%">OS Check Out</th>
                  <th style="width:3%">OS Hours</th>
                  <th style="width:3%">Branch</th>
                  <th style="width:3%">Status</th>
                  <th style="width:3%">Leave Type</th>
                  <th style="width:4%">Leave Reason</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="print-footer">
              <span class="footer-text">This sheet is generated by system software | A to Zee Switchgear Engineering (SMC) Pvt. Ltd.</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups for printing')
      return
    }

    printWindow.document.write(printHTML)
    printWindow.document.close()
  }, [filteredData, selectedEmployee, selectedDepartment, selectedBranch, getSelectedEmployeeName, getRowColor, fromDate, toDate, formatDateForDisplay])

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    isMounted.current = true
    fetchData()
    
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFromDate(firstDay.toISOString().split('T')[0])
    setToDate(lastDay.toISOString().split('T')[0])
    
    return () => {
      isMounted.current = false
    }
  }, [fetchData])

  useEffect(() => {
    if (employees.length > 0 && fromDate && toDate) {
      generateAttendanceSheet()
    }
  }, [employees, fromDate, toDate, selectedDepartment, selectedBranch, selectedEmployee, generateAttendanceSheet])

  // =====================================================
  // Component Render
  // =====================================================

  const summary = getSummary()

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
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ProtectedRoute allowedUser='hr'>
        <NavbarDropdown />
        <div className={`min-h-screen bg-gray-50 p-2 ${roboto.className}`}>
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="mb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="text-lg font-bold text-[#0071BD] tracking-wider">
                      Attendance Sheet
                    </h1>
                    <p className="text-[10px] text-gray-500 tracking-wide">
                      {selectedEmployee === 'all' 
                        ? 'All employees' 
                        : getSelectedEmployeeName()
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    K: {dataSource.K}
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    PQ: {dataSource.PQ}
                  </span>
                  <button
                    onClick={fetchData}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-1 tracking-wider"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowPrintOptions(true)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1 tracking-wider"
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                </div>
              </div>
            </div>

            {/* Print Options Modal */}
            {showPrintOptions && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 tracking-wider flex items-center gap-2">
                      <Printer className="w-5 h-5 text-[#0071BD]" />
                      Print Options
                    </h2>
                    <button
                      onClick={() => setShowPrintOptions(false)}
                      className="p-1 hover:bg-gray-200 rounded-lg transition"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 tracking-wide mb-4">
                    Select how you want to print the attendance sheet:
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePrintWithColor(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-800 tracking-wide">With Colors</p>
                        <p className="text-xs text-gray-500 tracking-wide">Show time-based colors (Blue, Green, Yellow, Red)</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handlePrintWithColor(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition group"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-800 tracking-wide">Without Colors</p>
                        <p className="text-xs text-gray-500 tracking-wide">Plain white background, no color coding</p>
                      </div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowPrintOptions(false)}
                    className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              <div className="bg-white shadow-sm p-1.5">
                <div className="text-[10px] text-[#0071BD] tracking-wide">Total</div>
                <div className="text-base font-bold text-[#0071BD] tracking-wider">{summary.total}</div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="text-[10px] text-green-600 tracking-wide flex items-center gap-0.5">
                  <UserCheck className="w-2.5 h-2.5" /> P
                </div>
                <div className="text-base font-bold text-green-700 tracking-wider">{summary.present}</div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="text-[10px] text-red-600 tracking-wide flex items-center gap-0.5">
                  <UserX className="w-2.5 h-2.5" /> A
                </div>
                <div className="text-base font-bold text-red-700 tracking-wider">{summary.absent}</div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="text-[10px] text-blue-600 tracking-wide flex items-center gap-0.5">
                  <UserMinus className="w-2.5 h-2.5" /> L
                </div>
                <div className="text-base font-bold text-blue-700 tracking-wider">{summary.leave}</div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="text-[10px] text-yellow-600 tracking-wide flex items-center gap-0.5">
                  <UserPlus className="w-2.5 h-2.5" /> H
                </div>
                <div className="text-base font-bold text-yellow-700 tracking-wider">{summary.halfDay}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white text-black shadow-sm p-1.5 mb-2">
              <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="flex items-center gap-1 text-gray-700 hover:text-[#0071BD] transition tracking-wider text-xs"
              >
                <Filter className="w-3 h-3" />
                {expandedFilters ? 'Hide Filters' : 'Show Filters'}
                {expandedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {expandedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 tracking-wide mb-0.5">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full pl-6 pr-1.5 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 tracking-wide mb-0.5">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full pl-6 pr-1.5 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 tracking-wide mb-0.5">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full pl-6 pr-1.5 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 tracking-wide mb-0.5">
                      Branch
                    </label>
                    <div className="relative">
                      <MapPin className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full pl-6 pr-1.5 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      >
                        <option value="all">All Branches</option>
                        {branches.map(branch => (
                          <option key={branch} value={branch}>
                            {getBranchDisplayName(branch)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 tracking-wide mb-0.5">
                      Employee
                    </label>
                    <div className="relative">
                      <User className="w-3 h-3 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full pl-6 pr-1.5 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      >
                        <option value="all">All Employees</option>
                        {employeeNames.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id}) - {getBranchDisplayName(emp.source)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Emp ID</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dept</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Designation</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Day</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check In</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check Out</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Hours</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">In Location</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Out Location</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">OS Check In</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">OS Check Out</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">OS Hours</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Branch</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Leave Type</th>
                      <th className="px-1.5 py-1 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Leave Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={19} className="px-2 py-3 text-center text-gray-500 text-xs">
                          <div className="flex flex-col items-center gap-1">
                            <Users className="w-6 h-6 text-gray-300" />
                            <p className="tracking-wide">No data found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-500 tracking-wide whitespace-nowrap">{index + 1}</td>
                          <td className="px-1.5 py-0.5 text-[10px] font-medium text-gray-800 tracking-wide whitespace-nowrap">{record.employeeId}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-700 tracking-wide whitespace-nowrap">{record.name}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.department}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.designation}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.date}</td>
                          <td className={`px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap ${record.day === 'Sunday' ? 'font-bold text-red-600' : ''}`}>{record.day}</td>
                          <td className="px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                            {record.hasCheckIn ? (
                              <div className="flex items-center gap-0.5">
                                <LogIn className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700 font-medium tracking-wide">{record.checkIn}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 tracking-wide">-</span>
                            )}
                          </td>
                          <td className="px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                            {record.hasCheckOut ? (
                              <div className="flex items-center gap-0.5">
                                <LogOut className="w-3 h-3 text-red-500 flex-shrink-0" />
                                <span className="text-gray-700 font-medium tracking-wide">{record.checkOut}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 tracking-wide">-</span>
                            )}
                          </td>
                          <td className="px-1.5 py-0.5 text-[10px] font-medium text-gray-800 tracking-wide whitespace-nowrap text-center">{record.totalHours}</td>
                          <td className="px-1.5 py-0.5 text-[10px]">
                            {record.isOnLeave ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <LocationDisplay location={record.checkInLocation} label="In" />
                            )}
                          </td>
                          <td className="px-1.5 py-0.5 text-[10px]">
                            {record.isOnLeave ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <LocationDisplay location={record.checkOutLocation} label="Out" />
                            )}
                          </td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.outsideCheckIn}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.outsideCheckOut}</td>
                          <td className="px-1.5 py-0.5 text-[10px] font-medium text-gray-800 tracking-wide whitespace-nowrap text-center">{record.outsideTotalHours}</td>
                          <td className="px-1.5 py-0.5 text-[10px] whitespace-nowrap">
                            <span className={`px-1 py-0.5 text-[9px] font-medium tracking-wide rounded-full ${
                              record.branchCode === 'PQ' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {record.branch}
                            </span>
                          </td>
                          <td className="px-1.5 py-0.5 whitespace-nowrap">
                            <span className={`px-1 py-0.5 text-[9px] font-medium tracking-wide rounded-full ${
                              record.status === 'Present' ? 'bg-green-100 text-green-700' :
                              record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                              record.status === 'Leave' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.leaveType || '-'}</td>
                          <td className="px-1.5 py-0.5 text-[10px] text-gray-600 tracking-wide whitespace-nowrap">{record.leaveReason || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            {filteredData.length > 0 && (
              <div className="mt-1.5 bg-white shadow-sm p-1.5">
                <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-600 tracking-wide">
                  <div>
                    {filteredData.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded"></span>
                      P: {summary.present}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-2 h-2 bg-red-500 rounded"></span>
                      A: {summary.absent}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-2 h-2 bg-blue-500 rounded"></span>
                      L: {summary.leave}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-2 h-2 bg-yellow-500 rounded"></span>
                      H: {summary.halfDay}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              <div className="bg-white shadow-sm p-1.5">
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <Users className="w-3 h-3 text-[#0071BD]" />
                  <span className="font-medium">Employees</span>
                </div>
                <div className="text-base font-bold text-[#0071BD]">{employees.length}</div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <Calendar className="w-3 h-3 text-[#0071BD]" />
                  <span className="font-medium">Range</span>
                </div>
                <div className="text-[10px] font-medium text-gray-700">
                  {formatDate(fromDate)} - {formatDate(toDate)}
                </div>
              </div>
              <div className="bg-white shadow-sm p-1.5">
                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                  <Building className="w-3 h-3 text-[#0071BD]" />
                  <span className="font-medium">Depts</span>
                </div>
                <div className="text-base font-medium text-gray-700">
                  {departments.length}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    </>
  )
}