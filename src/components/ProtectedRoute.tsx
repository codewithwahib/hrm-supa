// // components/ProtectedRoute.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Roboto } from 'next/font/google'
// import { Loader } from 'lucide-react'

// const roboto = Roboto({
//   weight: ['100', '300', '400', '500', '700', '900'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// interface ProtectedRouteProps {
//   children: React.ReactNode
//   allowedUser: 'hr' | 'admin'
// }

// export default function ProtectedRoute({
//   children,
//   allowedUser,
// }: ProtectedRouteProps) {
//   const router = useRouter()
//   const [loading, setLoading] = useState(true)
//   const [authorized, setAuthorized] = useState(false)

//   useEffect(() => {
//     let cancelled = false

//     const checkAuth = () => {
//       try {
//         // ✅ Check localStorage for user data
//         const userDataRaw = localStorage.getItem('hrms_user')

//         if (!userDataRaw) {
//           if (!cancelled) {
//             setAuthorized(false)
//             setLoading(false)
//           }
//           router.replace('/hr/login')
//           return
//         }

//         let userData
//         try {
//           userData = JSON.parse(userDataRaw)
//         } catch (error) {
//           console.error('Invalid user data:', error)
//           localStorage.removeItem('hrms_user')
//           if (!cancelled) {
//             setAuthorized(false)
//             setLoading(false)
//           }
//           router.replace('/hr/login')
//           return
//         }

//         // ✅ Check if user has the correct role
//         if (userData.role !== allowedUser) {
//           console.error('Invalid role:', userData.role)
//           if (!cancelled) {
//             setAuthorized(false)
//             setLoading(false)
//           }
//           router.replace('/hr/login')
//           return
//         }

//         // ✅ User is authorized
//         if (!cancelled) {
//           setAuthorized(true)
//           setLoading(false)
//         }

//       } catch (error) {
//         console.error('ProtectedRoute error:', error)
//         localStorage.removeItem('hrms_user')
//         if (!cancelled) {
//           setAuthorized(false)
//           setLoading(false)
//         }
//         router.replace('/hr/login')
//       }
//     }

//     checkAuth()

//     return () => {
//       cancelled = true
//     }
//   }, [router, allowedUser])

//   // ============================================
//   // LOADING
//   // ============================================

//   if (loading) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center">
//           <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
//         </div>
//       </div>
//     )
//   }

//   // ============================================
//   // NOT AUTHORIZED
//   // ============================================

//   if (!authorized) {
//     return null
//   }

//   // ============================================
//   // AUTHORIZED
//   // ============================================

//   return <>{children}</>
// }


// components/ProtectedRoute.tsx
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Roboto } from 'next/font/google'
import { Loader, Clock } from 'lucide-react'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUser: 'hr' | 'admin'
}

// ⏱️ Inactivity configuration (in milliseconds)
const INACTIVITY_TIMEOUT_MS = 90_000   // 1.5 minutes total
const WARNING_BEFORE_MS = 30_000       // Show warning 30 sec before logout

export default function ProtectedRoute({
  children,
  allowedUser,
}: ProtectedRouteProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30)

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    let cancelled = false

    const checkAuth = () => {
      try {
        const userDataRaw = localStorage.getItem('hrms_user')

        if (!userDataRaw) {
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/login')
          return
        }

        let userData
        try {
          userData = JSON.parse(userDataRaw)
        } catch (error) {
          console.error('Invalid user data:', error)
          localStorage.removeItem('hrms_user')
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/login')
          return
        }

        if (userData.role !== allowedUser) {
          console.error('Invalid role:', userData.role)
          if (!cancelled) {
            setAuthorized(false)
            setLoading(false)
          }
          router.replace('/login')
          return
        }

        if (!cancelled) {
          setAuthorized(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('ProtectedRoute error:', error)
        localStorage.removeItem('hrms_user')
        if (!cancelled) {
          setAuthorized(false)
          setLoading(false)
        }
        router.replace('/login')
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [router, allowedUser])

  // ============================================
  // INACTIVITY AUTO-LOGOUT (HR only)
  // ============================================
  const performLogout = useCallback(() => {
    localStorage.removeItem('hrms_user')
    router.replace('/login')
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
    if (!authorized || allowedUser !== 'hr') return

    clearAllTimers()
    setShowWarning(false)
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000))

    // Show warning at (timeout - warning) mark
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000))

      // Countdown every second
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

    // Logout at full timeout
    logoutTimerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS)
  }, [authorized, allowedUser, clearAllTimers, performLogout])

  useEffect(() => {
    if (!authorized || allowedUser !== 'hr') return

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
  }, [authorized, allowedUser, resetInactivityTimer, clearAllTimers])

  const handleStayLoggedIn = () => {
    resetInactivityTimer()
  }

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
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
  if (!authorized) {
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