// // src/app/attendance/[employeeId]/page.tsx
// 'use client'

// import { useState, useEffect, useRef, useCallback } from 'react'
// import Footer from '@/components/footer'
// import NavbarDropdown from '@/app/Navbar/page'
// import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
// import { useParams, useRouter } from 'next/navigation'
// import {
//   LogIn,
//   LogOut,
//   Clock,
//   Calendar,
//   CheckCircle,
//   XCircle,
//   Loader,
//   AlertCircle,
//   RefreshCw,
//   RotateCcw,
//   MapPin
// } from 'lucide-react'
// import { createClient } from '@supabase/supabase-js'
// import { Roboto } from 'next/font/google'

// const roboto = Roboto({
//   weight: ['100', '300', '400', '500', '700', '900'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// type AttendanceType = 'check-in' | 'check-out'

// interface AttendanceRecord {
//   time: string
//   location: string
//   coordinates?: {
//     lat: number
//     lng: number
//   }
// }

// interface Employee {
//   id: string
//   employee_id: string
//   full_name: string
//   department: string
//   position: string
//   check_in: AttendanceRecord[]
//   check_out: AttendanceRecord[]
// }

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // ✅ Function to get exact address from coordinates
// const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
//       {
//         headers: {
//           'User-Agent': 'HRMS-App/1.0'
//         }
//       }
//     )
//     const data = await response.json()
    
//     if (data && data.display_name) {
//       return data.display_name
//     }
//     return `${lat}, ${lng}`
//   } catch (error) {
//     return `${lat}, ${lng}`
//   }
// }

// export default function AttendancePage() {
//   const params = useParams()
//   const router = useRouter()
//   const employeeId = params.employeeId as string

//   const [employee, setEmployee] = useState<Employee | null>(null)
//   const [loading, setLoading] = useState<AttendanceType | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)
//   const [todaysCheckIn, setTodaysCheckIn] = useState<AttendanceRecord | null>(null)
//   const [todaysCheckOut, setTodaysCheckOut] = useState<AttendanceRecord | null>(null)
//   const [fetchingEmployee, setFetchingEmployee] = useState(true)
//   const [elapsedTime, setElapsedTime] = useState(0)
//   const [isRefreshing, setIsRefreshing] = useState(false)
//   const [isResetting, setIsResetting] = useState(false)
//   const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null)
//   const timerRef = useRef<NodeJS.Timeout | null>(null)
//   const isMounted = useRef(true)
  
//   const [isClient, setIsClient] = useState(false)
//   const [currentDate, setCurrentDate] = useState('')
//   const [currentTime, setCurrentTime] = useState('')
//   const [currentLocation, setCurrentLocation] = useState<string>('Fetching location...')
//   const [locationError, setLocationError] = useState<string | null>(null)

//   // ✅ Get current location on mount - LIVE EXACT ADDRESS
//   useEffect(() => {
//     const getLocation = () => {
//       if (!navigator.geolocation) {
//         setLocationError('Geolocation not supported')
//         setCurrentLocation('Location not available')
//         return
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords
//           const address = await getAddressFromCoords(latitude, longitude)
//           setCurrentLocation(address)
//         },
//         (error) => {
//           console.error('Location error:', error)
//           setLocationError('Unable to get location')
//           setCurrentLocation('Location not available')
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0
//         }
//       )
//     }

//     getLocation()
    
//     // ✅ Refresh location every 30 seconds
//     const locationInterval = setInterval(() => {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             const { latitude, longitude } = position.coords
//             const address = await getAddressFromCoords(latitude, longitude)
//             setCurrentLocation(address)
//           },
//           () => {},
//           { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//         )
//       }
//     }, 30000)

//     return () => clearInterval(locationInterval)
//   }, [])

//   useEffect(() => {
//     setIsClient(true)
    
//     const updateDateTime = () => {
//       const now = new Date()
//       setCurrentDate(now.toLocaleDateString('en-US', {
//         weekday: 'long',
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       }))
//       setCurrentTime(now.toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: true 
//       }))
//     }
    
//     updateDateTime()
//     const interval = setInterval(updateDateTime, 1000)
    
//     return () => {
//       clearInterval(interval)
//       isMounted.current = false
//     }
//   }, [])

//   useEffect(() => {
//     const savedCheckIn = localStorage.getItem(`checkIn_${employeeId}`)
//     const savedCheckOut = localStorage.getItem(`checkOut_${employeeId}`)
//     const savedDate = localStorage.getItem(`attendanceDate_${employeeId}`)
//     const savedElapsedTime = localStorage.getItem(`elapsedTime_${employeeId}`)
//     const savedTimerStartedAt = localStorage.getItem(`timerStartedAt_${employeeId}`)
//     const today = new Date().toISOString().split('T')[0]

//     if (savedDate === today) {
//       if (savedCheckIn) {
//         try {
//           const checkIn = JSON.parse(savedCheckIn)
//           setTodaysCheckIn(checkIn)
//         } catch (e) {
//           console.error('Error parsing saved check-in:', e)
//         }
//       }
//       if (savedCheckOut) {
//         try {
//           const checkOut = JSON.parse(savedCheckOut)
//           setTodaysCheckOut(checkOut)
//         } catch (e) {
//           console.error('Error parsing saved check-out:', e)
//         }
//       }
      
//       if (savedTimerStartedAt) {
//         const startedAt = parseInt(savedTimerStartedAt)
//         setTimerStartedAt(startedAt)
//         const now = Date.now()
//         const elapsed = Math.floor((now - startedAt) / 1000)
//         setElapsedTime(elapsed)
//       } else if (savedElapsedTime) {
//         setElapsedTime(parseInt(savedElapsedTime))
//       }
//     } else {
//       localStorage.removeItem(`checkIn_${employeeId}`)
//       localStorage.removeItem(`checkOut_${employeeId}`)
//       localStorage.removeItem(`attendanceDate_${employeeId}`)
//       localStorage.removeItem(`elapsedTime_${employeeId}`)
//       localStorage.removeItem(`timerStartedAt_${employeeId}`)
//     }
//   }, [employeeId])

//   const fetchEmployeeData = useCallback(async () => {
//     if (!employeeId || !isMounted.current) return

//     try {
//       setFetchingEmployee(true)
      
//       const today = new Date().toISOString().split('T')[0]
      
//       const { data: employeeData, error: employeeError } = await supabase
//         .from('employees')
//         .select('id, employee_id, full_name, department, position, check_in, check_out')
//         .eq('employee_id', employeeId)
//         .maybeSingle()

//       if (employeeError) {
//         setError(`Database error: ${employeeError.message}`)
//         setFetchingEmployee(false)
//         return
//       }

//       if (!employeeData) {
//         setError(`Employee not found: ${employeeId}`)
//         setFetchingEmployee(false)
//         return
//       }

//       setEmployee(employeeData)
      
//       const checkInArray = employeeData.check_in || []
//       const todayCheckIn = checkInArray.find((record: AttendanceRecord) => {
//         if (!record || !record.time) return false
//         const recordDate = new Date(record.time).toISOString().split('T')[0]
//         return recordDate === today
//       }) || null
      
//       const checkOutArray = employeeData.check_out || []
//       const todayCheckOut = checkOutArray.find((record: AttendanceRecord) => {
//         if (!record || !record.time) return false
//         const recordDate = new Date(record.time).toISOString().split('T')[0]
//         return recordDate === today
//       }) || null

//       if (todayCheckIn) {
//         setTodaysCheckIn(todayCheckIn)
//         localStorage.setItem(`checkIn_${employeeId}`, JSON.stringify(todayCheckIn))
//         localStorage.setItem(`attendanceDate_${employeeId}`, today)
//       }

//       if (todayCheckOut) {
//         setTodaysCheckOut(todayCheckOut)
//         localStorage.setItem(`checkOut_${employeeId}`, JSON.stringify(todayCheckOut))
//         localStorage.setItem(`attendanceDate_${employeeId}`, today)
//       }

//       if (todayCheckIn && !todayCheckOut) {
//         const savedStartedAt = localStorage.getItem(`timerStartedAt_${employeeId}`)
//         if (savedStartedAt) {
//           const startedAt = parseInt(savedStartedAt)
//           setTimerStartedAt(startedAt)
//           const now = Date.now()
//           setElapsedTime(Math.floor((now - startedAt) / 1000))
//         } else {
//           const checkInTime = new Date(todayCheckIn.time).getTime()
//           const now = Date.now()
//           const elapsed = Math.floor((now - checkInTime) / 1000)
//           setElapsedTime(elapsed)
//           setTimerStartedAt(checkInTime)
//           localStorage.setItem(`timerStartedAt_${employeeId}`, String(checkInTime))
//         }
//       } else if (todayCheckIn && todayCheckOut) {
//         const checkInTime = new Date(todayCheckIn.time).getTime()
//         const checkOutTime = new Date(todayCheckOut.time).getTime()
//         setElapsedTime(Math.floor((checkOutTime - checkInTime) / 1000))
//         localStorage.removeItem(`timerStartedAt_${employeeId}`)
//       }
      
//       setFetchingEmployee(false)
      
//     } catch (error) {
//       setError(error instanceof Error ? error.message : 'Failed to fetch employee data')
//       setFetchingEmployee(false)
//     }
//   }, [employeeId])

//   useEffect(() => {
//     fetchEmployeeData()
//   }, [fetchEmployeeData])

//   // Timer effect
//   useEffect(() => {
//     if (todaysCheckIn && !todaysCheckOut) {
//       if (!timerStartedAt) {
//         const now = Date.now()
//         const checkInTime = new Date(todaysCheckIn.time).getTime()
//         const startTime = Math.max(now, checkInTime)
//         setTimerStartedAt(startTime)
//         localStorage.setItem(`timerStartedAt_${employeeId}`, String(startTime))
//       }

//       if (timerRef.current) {
//         clearInterval(timerRef.current)
//       }

//       timerRef.current = setInterval(() => {
//         setElapsedTime(prev => {
//           const newTime = prev + 1
//           localStorage.setItem(`elapsedTime_${employeeId}`, String(newTime))
//           return newTime
//         })
//       }, 1000)
//     } else {
//       if (timerRef.current) {
//         clearInterval(timerRef.current)
//         timerRef.current = null
//       }
//       if (todaysCheckOut) {
//         localStorage.removeItem(`timerStartedAt_${employeeId}`)
//         localStorage.removeItem(`elapsedTime_${employeeId}`)
//       }
//     }

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current)
//         timerRef.current = null
//       }
//     }
//   }, [todaysCheckIn, todaysCheckOut, timerStartedAt, employeeId])

//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (todaysCheckIn && !todaysCheckOut) {
//         localStorage.setItem(`elapsedTime_${employeeId}`, String(elapsedTime))
//         if (timerStartedAt) {
//           localStorage.setItem(`timerStartedAt_${employeeId}`, String(timerStartedAt))
//         }
//       }
//     }

//     window.addEventListener('beforeunload', handleBeforeUnload)
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload)
//     }
//   }, [todaysCheckIn, todaysCheckOut, elapsedTime, timerStartedAt, employeeId])

//   const formatTime = (seconds: number) => {
//     const hrs = Math.floor(seconds / 3600)
//     const mins = Math.floor((seconds % 3600) / 60)
//     const secs = seconds % 60
//     return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
//   }

//   // ✅ Reset Function - Clears today's attendance data
//   const handleReset = async () => {
//     if (!employeeId) {
//       alert('Employee ID missing')
//       return
//     }

//     const confirmReset = window.confirm(
//       '⚠️ Are you sure you want to reset today\'s attendance?\n\nThis will clear your check-in and check-out records for today.'
//     )

//     if (!confirmReset) return

//     setIsResetting(true)
//     setError(null)
//     setSuccess(null)

//     try {
//       const today = new Date().toISOString().split('T')[0]
      
//       const { data: employeeData, error: fetchError } = await supabase
//         .from('employees')
//         .select('id, check_in, check_out')
//         .eq('employee_id', employeeId)
//         .maybeSingle()

//       if (fetchError) {
//         throw new Error(fetchError.message)
//       }

//       if (!employeeData) {
//         throw new Error('Employee not found')
//       }

//       const filteredCheckIn = (employeeData.check_in || []).filter((record: AttendanceRecord) => {
//         if (!record || !record.time) return true
//         const recordDate = new Date(record.time).toISOString().split('T')[0]
//         return recordDate !== today
//       })

//       const filteredCheckOut = (employeeData.check_out || []).filter((record: AttendanceRecord) => {
//         if (!record || !record.time) return true
//         const recordDate = new Date(record.time).toISOString().split('T')[0]
//         return recordDate !== today
//       })

//       const { error: updateError } = await supabase
//         .from('employees')
//         .update({
//           check_in: filteredCheckIn,
//           check_out: filteredCheckOut,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', employeeData.id)

//       if (updateError) {
//         throw new Error(updateError.message)
//       }

//       setTodaysCheckIn(null)
//       setTodaysCheckOut(null)
//       setElapsedTime(0)
//       setTimerStartedAt(null)
      
//       localStorage.removeItem(`checkIn_${employeeId}`)
//       localStorage.removeItem(`checkOut_${employeeId}`)
//       localStorage.removeItem(`attendanceDate_${employeeId}`)
//       localStorage.removeItem(`elapsedTime_${employeeId}`)
//       localStorage.removeItem(`timerStartedAt_${employeeId}`)

//       setSuccess('🔄 Attendance reset successfully!')
//       await fetchEmployeeData()

//       setTimeout(() => {
//         setSuccess(null)
//       }, 3000)

//     } catch (error) {
//       setError(error instanceof Error ? error.message : 'Failed to reset attendance')
//       setTimeout(() => {
//         setError(null)
//       }, 5000)
//     } finally {
//       setIsResetting(false)
//     }
//   }

//   const handleAttendance = (type: AttendanceType) => {
//     if (!employeeId) {
//       alert('Employee ID missing')
//       return
//     }

//     if (type === 'check-in' && todaysCheckIn) {
//       alert('You have already checked in today!')
//       return
//     }

//     if (type === 'check-out' && todaysCheckOut) {
//       alert('You have already checked out today!')
//       return
//     }

//     if (type === 'check-out' && !todaysCheckIn) {
//       alert('Please check in first before checking out!')
//       return
//     }

//     if (!navigator.geolocation) {
//       alert('Location is not supported by this browser.')
//       return
//     }

//     setLoading(type)
//     setError(null)
//     setSuccess(null)

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         try {
//           const latitude = position.coords.latitude
//           const longitude = position.coords.longitude
          
//           let location = `${latitude}, ${longitude}`
          
//           try {
//             const response = await fetch(
//               `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
//             )
//             const data = await response.json()
//             if (data && data.display_name) {
//               location = data.display_name
//             }
//           } catch (error) {
//             console.error('Error getting address:', error)
//           }

//           const apiUrl = type === 'check-in' 
//             ? '/api/attendance/check-in' 
//             : '/api/attendance/check-out'

//           const response = await fetch(apiUrl, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               employeeId,
//               location,
//               latitude,
//               longitude,
//             }),
//           })

//           const data = await response.json()

//           if (!response.ok || !data.success) {
//             throw new Error(data.error || `${type} failed`)
//           }

//           const now = new Date()
//           const today = new Date().toISOString().split('T')[0]
//           const newRecord = data.data.record

//           if (type === 'check-in') {
//             setTodaysCheckIn(newRecord)
//             setElapsedTime(0)
//             const startTime = now.getTime()
//             setTimerStartedAt(startTime)
//             localStorage.setItem(`timerStartedAt_${employeeId}`, String(startTime))
//             localStorage.setItem(`elapsedTime_${employeeId}`, '0')
//             setSuccess('✅ Check In Successful!')
//             localStorage.setItem(`checkIn_${employeeId}`, JSON.stringify(newRecord))
//             localStorage.setItem(`attendanceDate_${employeeId}`, today)
//           } else {
//             setTodaysCheckOut(newRecord)
//             if (todaysCheckIn) {
//               const checkInTime = new Date(todaysCheckIn.time).getTime()
//               const checkOutTime = now.getTime()
//               const totalElapsed = Math.floor((checkOutTime - checkInTime) / 1000)
//               setElapsedTime(totalElapsed)
//               localStorage.setItem(`elapsedTime_${employeeId}`, String(totalElapsed))
//             }
//             setSuccess('✅ Check Out Successful!')
//             localStorage.setItem(`checkOut_${employeeId}`, JSON.stringify(newRecord))
//             localStorage.removeItem(`timerStartedAt_${employeeId}`)
//           }

//           await fetchEmployeeData()

//           setTimeout(() => {
//             setSuccess(null)
//           }, 3000)

//         } catch (error) {
//           console.error('❌ ATTENDANCE ERROR:', error)
          
//           let errorMessage = 'Something went wrong'
//           if (error instanceof Error) {
//             errorMessage = error.message
//           }
          
//           setError(errorMessage)
//           setTimeout(() => {
//             setError(null)
//           }, 5000)
//         } finally {
//           setLoading(null)
//         }
//       },
//       (error) => {
//         console.error('❌ LOCATION ERROR:', error)
//         const errorMsg = error.code === 1
//           ? 'Location permission denied. Please allow location access.'
//           : error.code === 2
//           ? 'Location is unavailable.'
//           : error.code === 3
//           ? 'Location request timed out.'
//           : 'Unable to get your location.'
//         setError(errorMsg)
//         setTimeout(() => {
//           setError(null)
//         }, 3000)
//         setLoading(null)
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 0,
//       }
//     )
//   }

//   const handleRefresh = async () => {
//     setIsRefreshing(true)
//     await fetchEmployeeData()
//     setIsRefreshing(false)
//   }

//   const getTimeDisplay = (timestamp: string) => {
//     if (!timestamp) return '--:--:--'
//     try {
//       const date = new Date(timestamp)
//       return date.toLocaleTimeString('en-US', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: true 
//       })
//     } catch {
//       return '--:--:--'
//     }
//   }

//   // ✅ LOADING
//   if (fetchingEmployee) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center">
//           <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
//         </div>
//       </div>
//     )
//   }

//   // ✅ ERROR
//   if (error && !employee) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center bg-white shadow-sm p-8 max-w-md rounded-lg">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
//           <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
//           <button
//             onClick={fetchEmployeeData}
//             className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider rounded"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <>
//       <ProtectedEmployeeRoute allowedRole='employee'>
//         <NavbarDropdown/>
//         <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
//           <div className="max-w-4xl mx-auto">
//             {/* Header */}
//             <div className="mb-6">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                 <div>
//                   <h1 className="text-2xl font-bold text-[#0071BD] tracking-wider">
//                     Mark Attendance
//                   </h1>
//                   {employee && (
//                     <p className="text-sm text-gray-600 mt-1">
//                       {employee.full_name} • {employee.department}
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   {isClient && (
//                     <div className="text-sm text-gray-500 tracking-wide flex items-center gap-2" suppressHydrationWarning>
//                       <Calendar className="w-4 h-4" />
//                       {currentDate}
//                     </div>
//                   )}
//                   <button
//                     onClick={handleRefresh}
//                     disabled={isRefreshing}
//                     className={`p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-[#0071BD] ${
//                       isRefreshing ? 'animate-spin' : ''
//                     }`}
//                     title="Refresh"
//                   >
//                     <RefreshCw className="w-4 h-4" />
//                   </button>
//                   {/* ✅ Reset Button - Uncomment to enable */}
//                   {/* <button
//                     onClick={handleReset}
//                     disabled={isResetting}
//                     className={`p-2 rounded-full hover:bg-gray-100 transition text-red-400 hover:text-red-600 ${
//                       isResetting ? 'animate-spin' : ''
//                     }`}
//                     title="Reset Today's Attendance"
//                   >
//                     <RotateCcw className="w-4 h-4" />
//                   </button> */}
//                 </div>
//               </div>
//             </div>

            

//             {/* Success Message */}
//             {success && (
//               <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg">
//                 <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <p className="text-sm text-green-700 tracking-wide font-semibold">{success}</p>
//                 </div>
//                 <button
//                   onClick={() => setSuccess(null)}
//                   className="text-gray-400 hover:text-gray-600 flex-shrink-0"
//                 >
//                   <XCircle className="w-4 h-4" />
//                 </button>
//               </div>
//             )}

//             {/* Error Message */}
//             {error && (
//               <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg">
//                 <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <p className="text-sm text-red-700 tracking-wide font-semibold">Error</p>
//                   <p className="text-sm text-red-600 tracking-wide mt-1">{error}</p>
//                 </div>
//                 <button
//                   onClick={() => setError(null)}
//                   className="text-gray-400 hover:text-gray-600 flex-shrink-0"
//                 >
//                   <XCircle className="w-4 h-4" />
//                 </button>
//               </div>
//             )}

//             {/* Main Content */}
//             <div className="shadow-sm rounded-lg p-8">
//               {/* Timer Display */}
//               <div className="text-center mb-8">
//                 <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
//                   <Clock className="w-5 h-5 text-[#0071BD] flex-shrink-0" />
//                   <span className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
//                     {formatTime(elapsedTime)}
//                   </span>
//                   <span className="text-xs text-gray-500 tracking-wide">
//                     {todaysCheckIn && !todaysCheckOut ? '⏱️ Working...' : todaysCheckOut ? '✅ Completed' : '⏸️ Not Started'}
//                   </span>
//                 </div>
//               </div>

//               {/* Status Cards */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                 {/* Check In Status */}
//                 <div className={`p-4 border-l-4 rounded-r-lg ${todaysCheckIn ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-500 tracking-wide">Check In Status</p>
//                       <p className={`text-lg font-semibold tracking-wider ${todaysCheckIn ? 'text-green-700' : 'text-gray-500'}`}>
//                         {todaysCheckIn ? '✅ Checked In' : 'Not Checked In'}
//                       </p>
//                       {todaysCheckIn && (
//                         <p className="text-sm text-gray-600 tracking-wide mt-1">
//                           Time: {getTimeDisplay(todaysCheckIn.time)}
//                         </p>
//                       )}
//                     </div>
//                     <div className={`p-3 rounded-full ${todaysCheckIn ? 'bg-green-100' : 'bg-gray-200'} flex-shrink-0`}>
//                       <LogIn className={`w-6 h-6 ${todaysCheckIn ? 'text-green-600' : 'text-gray-400'}`} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Check Out Status */}
//                 <div className={`p-4 border-l-4 rounded-r-lg ${todaysCheckOut ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-gray-500 tracking-wide">Check Out Status</p>
//                       <p className={`text-lg font-semibold tracking-wider ${todaysCheckOut ? 'text-red-700' : 'text-gray-500'}`}>
//                         {todaysCheckOut ? '✅ Checked Out' : 'Not Checked Out'}
//                       </p>
//                       {todaysCheckOut && (
//                         <p className="text-sm text-gray-600 tracking-wide mt-1">
//                           Time: {getTimeDisplay(todaysCheckOut.time)}
//                         </p>
//                       )}
//                     </div>
//                     <div className={`p-3 rounded-full ${todaysCheckOut ? 'bg-red-100' : 'bg-gray-200'} flex-shrink-0`}>
//                       <LogOut className={`w-6 h-6 ${todaysCheckOut ? 'text-red-600' : 'text-gray-400'}`} />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Check In/Out Buttons */}
//               <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
//                 {/* Check In Button */}
//                 <button
//                   onClick={() => handleAttendance('check-in')}
//                   disabled={loading !== null || !!todaysCheckIn}
//                   className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
//                     todaysCheckIn
//                       ? 'bg-green-100 cursor-not-allowed border-4 border-green-500'
//                       : loading === 'check-in'
//                       ? 'bg-green-300 cursor-wait'
//                       : 'bg-gradient-to-br from-green-500 to-green-600 hover:shadow-xl text-white'
//                   }`}
//                 >
//                   {loading === 'check-in' ? (
//                     <Loader className="w-8 h-8 text-white animate-spin" />
//                   ) : todaysCheckIn ? (
//                     <>
//                       <CheckCircle className="w-8 h-8 text-green-600" />
//                       <span className="text-xs font-medium text-green-700 mt-1 tracking-wide">Done</span>
//                     </>
//                   ) : (
//                     <>
//                       <LogIn className="w-8 h-8" />
//                       <span className="text-sm font-semibold mt-1 tracking-wide">Check In</span>
//                     </>
//                   )}
//                 </button>

//                 {/* Check Out Button */}
//                 <button
//                   onClick={() => handleAttendance('check-out')}
//                   disabled={loading !== null || !!todaysCheckOut || !todaysCheckIn}
//                   className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
//                     todaysCheckOut
//                       ? 'bg-red-100 cursor-not-allowed border-4 border-red-500'
//                       : !todaysCheckIn
//                       ? 'bg-gray-200 cursor-not-allowed text-gray-400'
//                       : loading === 'check-out'
//                       ? 'bg-red-300 cursor-wait'
//                       : 'bg-gradient-to-br from-red-500 to-red-600 hover:shadow-xl text-white'
//                   }`}
//                 >
//                   {loading === 'check-out' ? (
//                     <Loader className="w-8 h-8 text-white animate-spin" />
//                   ) : todaysCheckOut ? (
//                     <>
//                       <CheckCircle className="w-8 h-8 text-red-600" />
//                       <span className="text-xs font-medium text-red-700 mt-1 tracking-wide">Done</span>
//                     </>
//                   ) : !todaysCheckIn ? (
//                     <>
//                       <LogOut className="w-8 h-8" />
//                       <span className="text-xs font-medium mt-1 tracking-wide">Check In First</span>
//                     </>
//                   ) : (
//                     <>
//                       <LogOut className="w-8 h-8" />
//                       <span className="text-sm font-semibold mt-1 tracking-wide">Check Out</span>
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Time Display */}
//               {isClient && (
//                 <div className="mt-8 text-center" suppressHydrationWarning>
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
//                     <Clock className="w-4 h-4 text-gray-500" />
//                     <span className="text-sm text-gray-600 tracking-wide">
//                       Current Time: {currentTime}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//         <Footer/>
//       </ProtectedEmployeeRoute>
//     </>
//   )
// }


// src/app/attendance/[employeeId]/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Footer from '@/components/footer'
import NavbarDropdown from '@/app/Navbar/page'
import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
import { useParams, useRouter } from 'next/navigation'
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  MapPin,
  Ban
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

type AttendanceType = 'check-in' | 'check-out'

interface AttendanceRecord {
  time: string
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
  check_in: AttendanceRecord[]
  check_out: AttendanceRecord[]
  enable_attendance: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ✅ Function to get exact address from coordinates
const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HRMS-App/1.0'
        }
      }
    )
    const data = await response.json()
    
    if (data && data.display_name) {
      return data.display_name
    }
    return `${lat}, ${lng}`
  } catch (error) {
    return `${lat}, ${lng}`
  }
}

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState<AttendanceType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [todaysCheckIn, setTodaysCheckIn] = useState<AttendanceRecord | null>(null)
  const [todaysCheckOut, setTodaysCheckOut] = useState<AttendanceRecord | null>(null)
  const [fetchingEmployee, setFetchingEmployee] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)
  
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentLocation, setCurrentLocation] = useState<string>('Fetching location...')
  const [locationError, setLocationError] = useState<string | null>(null)

  // ✅ Attendance enabled check
  const isAttendanceEnabled = employee?.enable_attendance !== false

  // ✅ Get current location on mount - LIVE EXACT ADDRESS
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported')
        setCurrentLocation('Location not available')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const address = await getAddressFromCoords(latitude, longitude)
          setCurrentLocation(address)
        },
        (error) => {
          console.error('Location error:', error)
          setLocationError('Unable to get location')
          setCurrentLocation('Location not available')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }

    getLocation()
    
    // ✅ Refresh location every 30 seconds
    const locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const address = await getAddressFromCoords(latitude, longitude)
            setCurrentLocation(address)
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }
    }, 30000)

    return () => clearInterval(locationInterval)
  }, [])

  useEffect(() => {
    setIsClient(true)
    
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      }))
    }
    
    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    
    return () => {
      clearInterval(interval)
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const savedCheckIn = localStorage.getItem(`checkIn_${employeeId}`)
    const savedCheckOut = localStorage.getItem(`checkOut_${employeeId}`)
    const savedDate = localStorage.getItem(`attendanceDate_${employeeId}`)
    const savedElapsedTime = localStorage.getItem(`elapsedTime_${employeeId}`)
    const savedTimerStartedAt = localStorage.getItem(`timerStartedAt_${employeeId}`)
    const today = new Date().toISOString().split('T')[0]

    if (savedDate === today) {
      if (savedCheckIn) {
        try {
          const checkIn = JSON.parse(savedCheckIn)
          setTodaysCheckIn(checkIn)
        } catch (e) {
          console.error('Error parsing saved check-in:', e)
        }
      }
      if (savedCheckOut) {
        try {
          const checkOut = JSON.parse(savedCheckOut)
          setTodaysCheckOut(checkOut)
        } catch (e) {
          console.error('Error parsing saved check-out:', e)
        }
      }
      
      if (savedTimerStartedAt) {
        const startedAt = parseInt(savedTimerStartedAt)
        setTimerStartedAt(startedAt)
        const now = Date.now()
        const elapsed = Math.floor((now - startedAt) / 1000)
        setElapsedTime(elapsed)
      } else if (savedElapsedTime) {
        setElapsedTime(parseInt(savedElapsedTime))
      }
    } else {
      localStorage.removeItem(`checkIn_${employeeId}`)
      localStorage.removeItem(`checkOut_${employeeId}`)
      localStorage.removeItem(`attendanceDate_${employeeId}`)
      localStorage.removeItem(`elapsedTime_${employeeId}`)
      localStorage.removeItem(`timerStartedAt_${employeeId}`)
    }
  }, [employeeId])

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId || !isMounted.current) return

    try {
      setFetchingEmployee(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, employee_id, full_name, department, position, check_in, check_out, enable_attendance')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (employeeError) {
        setError(`Database error: ${employeeError.message}`)
        setFetchingEmployee(false)
        return
      }

      if (!employeeData) {
        setError(`Employee not found: ${employeeId}`)
        setFetchingEmployee(false)
        return
      }

      setEmployee(employeeData)
      
      const checkInArray = employeeData.check_in || []
      const todayCheckIn = checkInArray.find((record: AttendanceRecord) => {
        if (!record || !record.time) return false
        const recordDate = new Date(record.time).toISOString().split('T')[0]
        return recordDate === today
      }) || null
      
      const checkOutArray = employeeData.check_out || []
      const todayCheckOut = checkOutArray.find((record: AttendanceRecord) => {
        if (!record || !record.time) return false
        const recordDate = new Date(record.time).toISOString().split('T')[0]
        return recordDate === today
      }) || null

      if (todayCheckIn) {
        setTodaysCheckIn(todayCheckIn)
        localStorage.setItem(`checkIn_${employeeId}`, JSON.stringify(todayCheckIn))
        localStorage.setItem(`attendanceDate_${employeeId}`, today)
      }

      if (todayCheckOut) {
        setTodaysCheckOut(todayCheckOut)
        localStorage.setItem(`checkOut_${employeeId}`, JSON.stringify(todayCheckOut))
        localStorage.setItem(`attendanceDate_${employeeId}`, today)
      }

      if (todayCheckIn && !todayCheckOut) {
        const savedStartedAt = localStorage.getItem(`timerStartedAt_${employeeId}`)
        if (savedStartedAt) {
          const startedAt = parseInt(savedStartedAt)
          setTimerStartedAt(startedAt)
          const now = Date.now()
          setElapsedTime(Math.floor((now - startedAt) / 1000))
        } else {
          const checkInTime = new Date(todayCheckIn.time).getTime()
          const now = Date.now()
          const elapsed = Math.floor((now - checkInTime) / 1000)
          setElapsedTime(elapsed)
          setTimerStartedAt(checkInTime)
          localStorage.setItem(`timerStartedAt_${employeeId}`, String(checkInTime))
        }
      } else if (todayCheckIn && todayCheckOut) {
        const checkInTime = new Date(todayCheckIn.time).getTime()
        const checkOutTime = new Date(todayCheckOut.time).getTime()
        setElapsedTime(Math.floor((checkOutTime - checkInTime) / 1000))
        localStorage.removeItem(`timerStartedAt_${employeeId}`)
      }
      
      setFetchingEmployee(false)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch employee data')
      setFetchingEmployee(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchEmployeeData()
  }, [fetchEmployeeData])

  // Timer effect
  useEffect(() => {
    if (todaysCheckIn && !todaysCheckOut && isAttendanceEnabled) {
      if (!timerStartedAt) {
        const now = Date.now()
        const checkInTime = new Date(todaysCheckIn.time).getTime()
        const startTime = Math.max(now, checkInTime)
        setTimerStartedAt(startTime)
        localStorage.setItem(`timerStartedAt_${employeeId}`, String(startTime))
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1
          localStorage.setItem(`elapsedTime_${employeeId}`, String(newTime))
          return newTime
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (todaysCheckOut) {
        localStorage.removeItem(`timerStartedAt_${employeeId}`)
        localStorage.removeItem(`elapsedTime_${employeeId}`)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [todaysCheckIn, todaysCheckOut, timerStartedAt, employeeId, isAttendanceEnabled])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (todaysCheckIn && !todaysCheckOut) {
        localStorage.setItem(`elapsedTime_${employeeId}`, String(elapsedTime))
        if (timerStartedAt) {
          localStorage.setItem(`timerStartedAt_${employeeId}`, String(timerStartedAt))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [todaysCheckIn, todaysCheckOut, elapsedTime, timerStartedAt, employeeId])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // ✅ Reset Function - Clears today's attendance data
  const handleReset = async () => {
    if (!employeeId) {
      alert('Employee ID missing')
      return
    }

    const confirmReset = window.confirm(
      '⚠️ Are you sure you want to reset today\'s attendance?\n\nThis will clear your check-in and check-out records for today.'
    )

    if (!confirmReset) return

    setIsResetting(true)
    setError(null)
    setSuccess(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: employeeData, error: fetchError } = await supabase
        .from('employees')
        .select('id, check_in, check_out')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!employeeData) {
        throw new Error('Employee not found')
      }

      const filteredCheckIn = (employeeData.check_in || []).filter((record: AttendanceRecord) => {
        if (!record || !record.time) return true
        const recordDate = new Date(record.time).toISOString().split('T')[0]
        return recordDate !== today
      })

      const filteredCheckOut = (employeeData.check_out || []).filter((record: AttendanceRecord) => {
        if (!record || !record.time) return true
        const recordDate = new Date(record.time).toISOString().split('T')[0]
        return recordDate !== today
      })

      const { error: updateError } = await supabase
        .from('employees')
        .update({
          check_in: filteredCheckIn,
          check_out: filteredCheckOut,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeData.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setTodaysCheckIn(null)
      setTodaysCheckOut(null)
      setElapsedTime(0)
      setTimerStartedAt(null)
      
      localStorage.removeItem(`checkIn_${employeeId}`)
      localStorage.removeItem(`checkOut_${employeeId}`)
      localStorage.removeItem(`attendanceDate_${employeeId}`)
      localStorage.removeItem(`elapsedTime_${employeeId}`)
      localStorage.removeItem(`timerStartedAt_${employeeId}`)

      setSuccess('🔄 Attendance reset successfully!')
      await fetchEmployeeData()

      setTimeout(() => {
        setSuccess(null)
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset attendance')
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setIsResetting(false)
    }
  }

  const handleAttendance = (type: AttendanceType) => {
    if (!employeeId) {
      alert('Employee ID missing')
      return
    }

    // ✅ Check if attendance is enabled
    if (!isAttendanceEnabled) {
      setError('❌ Attendance is currently disabled for you. Please contact HR.')
      setTimeout(() => {
        setError(null)
      }, 5000)
      return
    }

    if (type === 'check-in' && todaysCheckIn) {
      alert('You have already checked in today!')
      return
    }

    if (type === 'check-out' && todaysCheckOut) {
      alert('You have already checked out today!')
      return
    }

    if (type === 'check-out' && !todaysCheckIn) {
      alert('Please check in first before checking out!')
      return
    }

    if (!navigator.geolocation) {
      alert('Location is not supported by this browser.')
      return
    }

    setLoading(type)
    setError(null)
    setSuccess(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
          
          let location = `${latitude}, ${longitude}`
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )
            const data = await response.json()
            if (data && data.display_name) {
              location = data.display_name
            }
          } catch (error) {
            console.error('Error getting address:', error)
          }

          const apiUrl = type === 'check-in' 
            ? '/api/attendance/check-in' 
            : '/api/attendance/check-out'

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId,
              location,
              latitude,
              longitude,
            }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error || `${type} failed`)
          }

          const now = new Date()
          const today = new Date().toISOString().split('T')[0]
          const newRecord = data.data.record

          if (type === 'check-in') {
            setTodaysCheckIn(newRecord)
            setElapsedTime(0)
            const startTime = now.getTime()
            setTimerStartedAt(startTime)
            localStorage.setItem(`timerStartedAt_${employeeId}`, String(startTime))
            localStorage.setItem(`elapsedTime_${employeeId}`, '0')
            setSuccess('✅ Check In Successful!')
            localStorage.setItem(`checkIn_${employeeId}`, JSON.stringify(newRecord))
            localStorage.setItem(`attendanceDate_${employeeId}`, today)
          } else {
            setTodaysCheckOut(newRecord)
            if (todaysCheckIn) {
              const checkInTime = new Date(todaysCheckIn.time).getTime()
              const checkOutTime = now.getTime()
              const totalElapsed = Math.floor((checkOutTime - checkInTime) / 1000)
              setElapsedTime(totalElapsed)
              localStorage.setItem(`elapsedTime_${employeeId}`, String(totalElapsed))
            }
            setSuccess('✅ Check Out Successful!')
            localStorage.setItem(`checkOut_${employeeId}`, JSON.stringify(newRecord))
            localStorage.removeItem(`timerStartedAt_${employeeId}`)
          }

          await fetchEmployeeData()

          setTimeout(() => {
            setSuccess(null)
          }, 3000)

        } catch (error) {
          console.error('❌ ATTENDANCE ERROR:', error)
          
          let errorMessage = 'Something went wrong'
          if (error instanceof Error) {
            errorMessage = error.message
          }
          
          setError(errorMessage)
          setTimeout(() => {
            setError(null)
          }, 5000)
        } finally {
          setLoading(null)
        }
      },
      (error) => {
        console.error('❌ LOCATION ERROR:', error)
        const errorMsg = error.code === 1
          ? 'Location permission denied. Please allow location access.'
          : error.code === 2
          ? 'Location is unavailable.'
          : error.code === 3
          ? 'Location request timed out.'
          : 'Unable to get your location.'
        setError(errorMsg)
        setTimeout(() => {
          setError(null)
        }, 3000)
        setLoading(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchEmployeeData()
    setIsRefreshing(false)
  }

  const getTimeDisplay = (timestamp: string) => {
    if (!timestamp) return '--:--:--'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      })
    } catch {
      return '--:--:--'
    }
  }

  // ✅ LOADING
  if (fetchingEmployee) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  // ✅ ERROR
  if (error && !employee) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
          <button
            onClick={fetchEmployeeData}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ✅ ATTENDANCE DISABLED - Same design as Site Visit disabled
  if (!isAttendanceEnabled) {
    return (
      <>
        <ProtectedEmployeeRoute allowedRole='employee'>
          <NavbarDropdown />
          <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-sm p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">
                  Attendance Disabled
                </h3>
                <p className="text-gray-600 mb-4 tracking-wide">
                  Attendance marking is not enabled for your account. 
                  Please contact your administrator.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/${employeeId}`)}
                  className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider rounded"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </ProtectedEmployeeRoute>
      </>
    )
  }

  return (
    <>
      <ProtectedEmployeeRoute allowedRole='employee'>
        <NavbarDropdown/>
        <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0071BD] tracking-wider">
                    Mark Attendance
                  </h1>
                  {employee && (
                    <p className="text-sm text-gray-600 mt-1">
                      {employee.full_name} • {employee.department}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isClient && (
                    <div className="text-sm text-gray-500 tracking-wide flex items-center gap-2" suppressHydrationWarning>
                      <Calendar className="w-4 h-4" />
                      {currentDate}
                    </div>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-[#0071BD] ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {/* ✅ Reset Button - Uncomment to enable */}
                  {/* <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className={`p-2 rounded-full hover:bg-gray-100 transition text-red-400 hover:text-red-600 ${
                      isResetting ? 'animate-spin' : ''
                    }`}
                    title="Reset Today's Attendance"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button> */}
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-700 tracking-wide font-semibold">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 tracking-wide font-semibold">Error</p>
                  <p className="text-sm text-red-600 tracking-wide mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Content */}
            <div className="shadow-sm rounded-lg p-8">
              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Clock className="w-5 h-5 text-[#0071BD] flex-shrink-0" />
                  <span className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                    {formatTime(elapsedTime)}
                  </span>
                  <span className="text-xs text-gray-500 tracking-wide">
                    {todaysCheckIn && !todaysCheckOut ? '⏱️ Working...' : todaysCheckOut ? '✅ Completed' : '⏸️ Not Started'}
                  </span>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Check In Status */}
                <div className={`p-4 border-l-4 rounded-r-lg ${todaysCheckIn ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 tracking-wide">Check In Status</p>
                      <p className={`text-lg font-semibold tracking-wider ${todaysCheckIn ? 'text-green-700' : 'text-gray-500'}`}>
                        {todaysCheckIn ? '✅ Checked In' : 'Not Checked In'}
                      </p>
                      {todaysCheckIn && (
                        <p className="text-sm text-gray-600 tracking-wide mt-1">
                          Time: {getTimeDisplay(todaysCheckIn.time)}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${todaysCheckIn ? 'bg-green-100' : 'bg-gray-200'} flex-shrink-0`}>
                      <LogIn className={`w-6 h-6 ${todaysCheckIn ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </div>

                {/* Check Out Status */}
                <div className={`p-4 border-l-4 rounded-r-lg ${todaysCheckOut ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 tracking-wide">Check Out Status</p>
                      <p className={`text-lg font-semibold tracking-wider ${todaysCheckOut ? 'text-red-700' : 'text-gray-500'}`}>
                        {todaysCheckOut ? '✅ Checked Out' : 'Not Checked Out'}
                      </p>
                      {todaysCheckOut && (
                        <p className="text-sm text-gray-600 tracking-wide mt-1">
                          Time: {getTimeDisplay(todaysCheckOut.time)}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${todaysCheckOut ? 'bg-red-100' : 'bg-gray-200'} flex-shrink-0`}>
                      <LogOut className={`w-6 h-6 ${todaysCheckOut ? 'text-red-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Check In/Out Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                {/* Check In Button */}
                <button
                  onClick={() => handleAttendance('check-in')}
                  disabled={loading !== null || !!todaysCheckIn}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
                    todaysCheckIn
                      ? 'bg-green-100 cursor-not-allowed border-4 border-green-500'
                      : loading === 'check-in'
                      ? 'bg-green-300 cursor-wait'
                      : 'bg-gradient-to-br from-green-500 to-green-600 hover:shadow-xl text-white'
                  }`}
                >
                  {loading === 'check-in' ? (
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  ) : todaysCheckIn ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <span className="text-xs font-medium text-green-700 mt-1 tracking-wide">Done</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-8 h-8" />
                      <span className="text-sm font-semibold mt-1 tracking-wide">Check In</span>
                    </>
                  )}
                </button>

                {/* Check Out Button */}
                <button
                  onClick={() => handleAttendance('check-out')}
                  disabled={loading !== null || !!todaysCheckOut || !todaysCheckIn}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
                    todaysCheckOut
                      ? 'bg-red-100 cursor-not-allowed border-4 border-red-500'
                      : !todaysCheckIn
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400'
                      : loading === 'check-out'
                      ? 'bg-red-300 cursor-wait'
                      : 'bg-gradient-to-br from-red-500 to-red-600 hover:shadow-xl text-white'
                  }`}
                >
                  {loading === 'check-out' ? (
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  ) : todaysCheckOut ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-red-600" />
                      <span className="text-xs font-medium text-red-700 mt-1 tracking-wide">Done</span>
                    </>
                  ) : !todaysCheckIn ? (
                    <>
                      <LogOut className="w-8 h-8" />
                      <span className="text-xs font-medium mt-1 tracking-wide">Check In First</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-8 h-8" />
                      <span className="text-sm font-semibold mt-1 tracking-wide">Check Out</span>
                    </>
                  )}
                </button>
              </div>

              {/* Time Display */}
              {isClient && (
                <div className="mt-8 text-center" suppressHydrationWarning>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 tracking-wide">
                      Current Time: {currentTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer/>
      </ProtectedEmployeeRoute>
    </>
  )
}