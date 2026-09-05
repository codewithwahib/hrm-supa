'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'
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

export default function ProtectedEmployeeRoute({
  children,
  allowedRole = 'employee',
}: Props) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check immediately - no Supabase query
    const checkAuth = () => {
      try {
        const employeeDataRaw = localStorage.getItem('employeeData')
        const employeeIdRaw = localStorage.getItem('employeeId')

        // If no data, redirect to login
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

        // Role check (only if role is specified in data)
        if (allowedRole && employeeData.role && employeeData.role !== allowedRole) {
          console.error('Invalid role:', employeeData.role)
          setIsAuthorized(false)
          router.replace(`/dashboard/${loginEmployeeId}`)
          return
        }

        // ✅ Authorized - fast path
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

    // Run immediately (synchronous)
    checkAuth()
  }, [router, allowedRole])

  // Show loading only briefly while checking
  if (isAuthorized === null) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  // Not authorized - redirecting
  if (!isAuthorized) {
    return null
  }

  // Authorized - render children
  return <>{children}</>
}