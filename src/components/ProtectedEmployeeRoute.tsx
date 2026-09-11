// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Loader } from 'lucide-react'
// import { Roboto } from 'next/font/google'

// const roboto = Roboto({
//   weight: ['100', '300', '400', '500', '700', '900'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// interface Props {
//   children: React.ReactNode
//   allowedRole?: 'employee' | 'hr'
// }

// interface EmployeeData {
//   role?: 'employee' | 'hr'
//   employeeId?: string
//   fullName?: string
// }

// export default function ProtectedEmployeeRoute({
//   children,
//   allowedRole = 'employee',
// }: Props) {
//   const router = useRouter()
//   const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

//   useEffect(() => {
//     // Check immediately - no Supabase query
//     const checkAuth = () => {
//       try {
//         const employeeDataRaw = localStorage.getItem('employeeData')
//         const employeeIdRaw = localStorage.getItem('employeeId')

//         // If no data, redirect to login
//         if (!employeeDataRaw && !employeeIdRaw) {
//           setIsAuthorized(false)
//           router.replace('/')
//           return
//         }

//         let employeeData: EmployeeData = {}
//         try {
//           if (employeeDataRaw) {
//             employeeData = JSON.parse(employeeDataRaw)
//           }
//         } catch (error) {
//           console.error('Invalid employeeData:', error)
//           localStorage.removeItem('employeeData')
//           localStorage.removeItem('employeeId')
//           setIsAuthorized(false)
//           router.replace('/')
//           return
//         }

//         const loginEmployeeId = employeeData.employeeId?.trim() || employeeIdRaw?.trim()

//         if (!loginEmployeeId) {
//           console.error('Employee ID not found')
//           localStorage.removeItem('employeeData')
//           localStorage.removeItem('employeeId')
//           setIsAuthorized(false)
//           router.replace('/')
//           return
//         }

//         // Role check (only if role is specified in data)
//         if (allowedRole && employeeData.role && employeeData.role !== allowedRole) {
//           console.error('Invalid role:', employeeData.role)
//           setIsAuthorized(false)
//           router.replace(`/dashboard/${loginEmployeeId}`)
//           return
//         }

//         // ✅ Authorized - fast path
//         setIsAuthorized(true)
//         console.log('✅ Protected route authorized (fast) for:', loginEmployeeId)

//       } catch (error) {
//         console.error('ProtectedEmployeeRoute error:', error)
//         localStorage.removeItem('employeeData')
//         localStorage.removeItem('employeeId')
//         setIsAuthorized(false)
//         router.replace('/')
//       }
//     }

//     // Run immediately (synchronous)
//     checkAuth()
//   }, [router, allowedRole])

//   // Show loading only briefly while checking
//   if (isAuthorized === null) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center">
//           <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
//         </div>
//       </div>
//     )
//   }

//   // Not authorized - redirecting
//   if (!isAuthorized) {
//     return null
//   }

//   // Authorized - render children
//   return <>{children}</>
// }


'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, Clock } from 'lucide-react'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface Props {
  children: React.ReactNode
  allowedRole?: 'employee' | 'hr'
}

interface EmployeeData {
  role?: 'employee' | 'hr'
  employeeId?: string
  fullName?: string
}

// ⏱️ Inactivity configuration (in milliseconds)
const INACTIVITY_TIMEOUT_MS = 90_000   // 1.5 minutes total
const WARNING_BEFORE_MS = 30_000       // Show warning 30 sec before logout

export default function ProtectedEmployeeRoute({
  children,
  allowedRole = 'employee',
}: Props) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30)

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    const checkAuth = () => {
      try {
        const employeeDataRaw = localStorage.getItem('employeeData')
        const employeeIdRaw = localStorage.getItem('employeeId')

        if (!employeeDataRaw && !employeeIdRaw) {
          setIsAuthorized(false)
          router.replace('/')
          return
        }

        let employeeData: EmployeeData = {}
        try {
          if (employeeDataRaw) {
            employeeData = JSON.parse(employeeDataRaw)
          }
        } catch (error) {
          console.error('Invalid employeeData:', error)
          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')
          setIsAuthorized(false)
          router.replace('/')
          return
        }

        const loginEmployeeId = employeeData.employeeId?.trim() || employeeIdRaw?.trim()

        if (!loginEmployeeId) {
          console.error('Employee ID not found')
          localStorage.removeItem('employeeData')
          localStorage.removeItem('employeeId')
          setIsAuthorized(false)
          router.replace('/')
          return
        }

        if (allowedRole && employeeData.role && employeeData.role !== allowedRole) {
          console.error('Invalid role:', employeeData.role)
          setIsAuthorized(false)
          router.replace(`/dashboard/${loginEmployeeId}`)
          return
        }

        setIsAuthorized(true)
        console.log('✅ Protected route authorized (fast) for:', loginEmployeeId)
      } catch (error) {
        console.error('ProtectedEmployeeRoute error:', error)
        localStorage.removeItem('employeeData')
        localStorage.removeItem('employeeId')
        setIsAuthorized(false)
        router.replace('/')
      }
    }

    checkAuth()
  }, [router, allowedRole])

  // ============================================
  // INACTIVITY AUTO-LOGOUT (Employee only)
  // ============================================
  const performLogout = useCallback(() => {
    localStorage.removeItem('employeeData')
    localStorage.removeItem('employeeId')
    router.replace('/')
  }, [router])

  const clearAllTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    logoutTimerRef.current = null
    warnTimerRef.current = null
    countdownRef.current = null
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthorized) return

    clearAllTimers()
    setShowWarning(false)
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000))

    // Show warning at (timeout - warning) mark
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000))

      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)

    logoutTimerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS)
  }, [isAuthorized, clearAllTimers, performLogout])

  useEffect(() => {
    if (!isAuthorized) return

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ]

    resetInactivityTimer()

    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetInactivityTimer, { passive: true })
    )

    const onVisibility = () => {
      if (document.visibilityState === 'visible') resetInactivityTimer()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearAllTimers()
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, resetInactivityTimer)
      )
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isAuthorized, resetInactivityTimer, clearAllTimers])

  const handleStayLoggedIn = () => {
    resetInactivityTimer()
  }

  // ============================================
  // LOADING
  // ============================================
  if (isAuthorized === null) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  // ============================================
  // NOT AUTHORIZED
  // ============================================
  if (!isAuthorized) {
    return null
  }

  // ============================================
  // AUTHORIZED
  // ============================================
  return (
    <>
      {children}

      {/* ⚠️ Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-center ${roboto.className}`}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className={`text-lg font-bold text-gray-800 tracking-wider mb-2 ${roboto.className}`}>
              Session Expiring
            </h3>
            <p className={`text-sm text-gray-600 tracking-wide mb-1 ${roboto.className}`}>
              You&apos;ve been inactive. You&apos;ll be logged out in
            </p>
            <p className={`text-3xl font-bold text-red-600 tracking-wider my-3 ${roboto.className}`}>
              {secondsLeft}s
            </p>
            <button
              onClick={handleStayLoggedIn}
              className={`w-full py-2.5 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider text-sm font-medium rounded ${roboto.className}`}
            >
              Stay Logged In
            </button>
            <button
              onClick={performLogout}
              className={`w-full mt-2 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition tracking-wider text-sm rounded ${roboto.className}`}
            >
              Logout Now
            </button>
          </div>
        </div>
      )}
    </>
  )
}