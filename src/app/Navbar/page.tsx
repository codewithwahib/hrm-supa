'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

import {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  ClipboardCheck,
  History,
  FileText,
  ListChecks,
  MapPin,
  HelpCircle,      // ✅ Added
  MessageCircle,   // ✅ Added
  Inbox            // ✅ Added
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

interface Employee {
  employeeId: string
  fullName: string
  designation: string
}

// ✅ 1. Supabase client OUTSIDE component - Created once
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NavbarDropdown() {
  const pathname = usePathname()
  const router = useRouter()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState<string>('')
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true)

  const profileRef = useRef<HTMLDivElement>(null)
  const attendanceRef = useRef<HTMLDivElement>(null)
  const leavesRef = useRef<HTMLDivElement>(null)
  const siteVisitRef = useRef<HTMLDivElement>(null)
  const queriesRef = useRef<HTMLDivElement>(null)  // ✅ Added
  const employeeIdRef = useRef<string>('')

  // Track which dropdown is open for hover
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================
  // 1. GET LOGGED-IN EMPLOYEE ID (Synchronous - Fast)
  // ============================================================

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loggedInId = localStorage.getItem('employeeId')

    if (loggedInId) {
      employeeIdRef.current = loggedInId
      setEmployeeId(loggedInId)
    } else {
      console.error('No logged-in employee ID found.')
      employeeIdRef.current = ''
      setEmployeeId('')
    }
  }, [])

  // ============================================================
  // 2. FETCH EMPLOYEE DATA (Background - Non-blocking)
  // ============================================================

  useEffect(() => {
    if (!employeeId) {
      setIsLoadingEmployee(false)
      return
    }

    let cancelled = false

    const fetchCurrentEmployee = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('employee_id, full_name, position')
          .eq('employee_id', employeeId)
          .maybeSingle()

        if (error) {
          console.error('Supabase error:', error)
          return
        }

        if (!cancelled && data) {
          setCurrentEmployee({
            employeeId: data.employee_id,
            fullName: data.full_name,
            designation: data.position
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching employee data:', error)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEmployee(false)
        }
      }
    }

    fetchCurrentEmployee()

    return () => {
      cancelled = true
    }
  }, [employeeId])

  // ============================================================
  // 3. GET ONLY LOGGED-IN ID
  // ============================================================

  const getEmployeeId = () => {
    return employeeIdRef.current
  }

  const stableId = getEmployeeId()

  // ============================================================
  // 4. NAVIGATION - ✅ Added QUERIES section
  // ============================================================

  const navigation: NavItem[] = [
    {
      name: 'DASHBOARD',
      href: stableId ? `/dashboard/${stableId}` : '#',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'ATTENDANCE',
      href: '#',
      icon: <CalendarClock className="w-5 h-5" />,
      children: [
        {
          name: 'Mark Attendance',
          href: stableId ? `/attendance/${stableId}` : '#',
          icon: <ClipboardCheck className="w-4 h-4" />,
        },
        {
          name: 'Attendance History',
          href: stableId ? `/attendance-history/${stableId}` : '#',
          icon: <History className="w-4 h-4" />,
        },
      ],
    },
    {
      name: 'LEAVES',
      href: '#',
      icon: <CalendarDays className="w-5 h-5" />,
      children: [
        {
          name: 'Apply Leave',
          href: stableId ? `/leaves/${stableId}` : '#',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          name: 'Leave History',
          href: stableId ? `/leave-history/${stableId}` : '#',
          icon: <ListChecks className="w-4 h-4" />,
        },
      ],
    },
    {
      name: 'SITE VISIT',
      href: '#',
      icon: <MapPin className="w-5 h-5" />,
      children: [
        {
          name: 'New Site Visit',
          href: stableId ? `/site-visit/${stableId}` : '#',
          icon: <MapPin className="w-4 h-4" />,
        },
        {
          name: 'Site Visit History',
          href: stableId ? `/site-visit-history/${stableId}` : '#',
          icon: <ListChecks className="w-4 h-4" />,
        },
      ],
    },
    // ✅ NEW: QUERIES Section
    {
      name: 'QUERIES',
      href: '#',
      icon: <HelpCircle className="w-5 h-5" />,
      children: [
        {
          name: 'Submit Query',
          href: stableId ? `/query/${stableId}` : '#',
          icon: <MessageCircle className="w-4 h-4" />,
        },
        {
          name: 'Query History',
          href: stableId ? `/query-history/${stableId}` : '#',
          icon: <Inbox className="w-4 h-4" />,
        },
      ],
    },
    {
      name: 'PAYROLL',
      href: stableId ? `/payroll/${stableId}` : '#',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      name: 'SETTINGS',
      href: stableId ? `/settings/${stableId}` : '#',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  // ============================================================
  // 5. ACTIVE ROUTE
  // ============================================================

  const isActive = (href: string) => {
    if (href === '#') return false
    if (!pathname) return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false
    return children.some((child) => isActive(child.href))
  }

  // ============================================================
  // 6. NAVIGATION HANDLER
  // ============================================================

  const handleNavigation = (href: string) => {
    if (!href || href === '#') return

    const loginId = getEmployeeId()

    if (!loginId) {
      console.error('Logged-in employee ID not found.')
      return
    }

    setIsNavigating(true)
    setIsMobileMenuOpen(false)
    setIsProfileDropdownOpen(false)

    document.querySelectorAll('.nav-dropdown').forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })

    router.push(href)

    setTimeout(() => {
      setIsNavigating(false)
    }, 500)
  }

  // ============================================================
  // 7. HOVER HANDLERS
  // ============================================================

  const handleMouseEnter = (dropdownId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    document.querySelectorAll('.nav-dropdown').forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })

    const dropdown = document.getElementById(dropdownId)
    if (dropdown) {
      dropdown.style.display = 'block'
    }
    setHoveredDropdown(dropdownId)
  }

  const handleMouseLeave = (dropdownId: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      const dropdown = document.getElementById(dropdownId)
      if (dropdown) {
        dropdown.style.display = 'none'
      }
      setHoveredDropdown(null)
    }, 150)
  }

  const handleDropdownMouseEnter = (dropdownId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    const dropdown = document.getElementById(dropdownId)
    if (dropdown) {
      dropdown.style.display = 'block'
    }
  }

  const handleDropdownMouseLeave = (dropdownId: string) => {
    hoverTimeoutRef.current = setTimeout(() => {
      const dropdown = document.getElementById(dropdownId)
      if (dropdown) {
        dropdown.style.display = 'none'
      }
      setHoveredDropdown(null)
    }, 150)
  }

  // ============================================================
  // 8. DROPDOWN OUTSIDE CLICK
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false)
      }

      const attendanceDropdown = document.getElementById('dropdown-ATTENDANCE')
      if (attendanceDropdown && attendanceRef.current && !attendanceRef.current.contains(target)) {
        attendanceDropdown.style.display = 'none'
        setHoveredDropdown(null)
      }

      const leavesDropdown = document.getElementById('dropdown-LEAVES')
      if (leavesDropdown && leavesRef.current && !leavesRef.current.contains(target)) {
        leavesDropdown.style.display = 'none'
        setHoveredDropdown(null)
      }

      const siteVisitDropdown = document.getElementById('dropdown-SITE VISIT')
      if (siteVisitDropdown && siteVisitRef.current && !siteVisitRef.current.contains(target)) {
        siteVisitDropdown.style.display = 'none'
        setHoveredDropdown(null)
      }

      // ✅ QUERIES dropdown close on outside click
      const queriesDropdown = document.getElementById('dropdown-QUERIES')
      if (queriesDropdown && queriesRef.current && !queriesRef.current.contains(target)) {
        queriesDropdown.style.display = 'none'
        setHoveredDropdown(null)
      }
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }
  }, [])

  // ============================================================
  // 9. EMPLOYEE DISPLAY DATA (With fallback)
  // ============================================================

  const displayName = currentEmployee?.fullName || 'Employee'
  const displayDesignation = currentEmployee?.designation || 'Employee'

  // ============================================================
  // 10. LOGOUT
  // ============================================================

  const handleLogout = () => {
    setIsProfileDropdownOpen(false)
    setIsMobileMenuOpen(false)

    if (
      typeof window !== 'undefined' &&
      window.confirm('Are you sure you want to logout?')
    ) {
      localStorage.removeItem('employeeData')
      localStorage.removeItem('employeeLogin')
      localStorage.removeItem('employeeId')
      localStorage.removeItem('hrms_user')
      sessionStorage.clear()

      employeeIdRef.current = ''
      setEmployeeId('')
      setCurrentEmployee(null)

      router.push('/')
    }
  }

  // ============================================================
  // 11. LOGO
  // ============================================================

  const handleLogoClick = () => {
    const loginId = getEmployeeId()
    if (!loginId) return
    handleNavigation(`/dashboard/${loginId}`)
  }

  // ============================================================
  // 12. RETURN - Navbar renders immediately
  // ============================================================

  return (
    <>
      {/* ======================================================
          TOP NAVBAR - Fixed, renders immediately
      ====================================================== */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">

        <div className="flex items-center justify-between px-4 h-16">

          {/* LEFT SECTION */}

          <div className="flex items-center gap-3">

            {/* MOBILE MENU BUTTON */}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:text-blue-700 transition lg:hidden"
              disabled={isNavigating}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* LOGO */}

            <button
              onClick={handleLogoClick}
              className="flex items-center cursor-pointer"
              disabled={isNavigating || !stableId}
            >
              <div className="relative w-32 h-16 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="A to Zee Switchgear Engineering (SMC) Pvt. Ltd."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </button>

            <div className="hidden lg:block w-px h-10 bg-gray-300" />

          </div>

          {/* DESKTOP NAVIGATION */}

          <div className="hidden lg:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">

            {navigation.map((item) => (

              <div key={item.name} className="relative">

                {item.children ? (

                  <div
                    ref={
                      item.name === 'ATTENDANCE'
                        ? attendanceRef
                        : item.name === 'LEAVES'
                        ? leavesRef
                        : item.name === 'SITE VISIT'
                        ? siteVisitRef
                        : queriesRef  // ✅ QUERIES ref
                    }
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(`dropdown-${item.name}`)}
                    onMouseLeave={() => handleMouseLeave(`dropdown-${item.name}`)}
                  >

                    <button
                      className={`
                        flex flex-col items-center gap-0.5 min-w-[65px] relative py-1
                        ${isChildActive(item.children) ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'}
                      `}
                      disabled={isNavigating || !stableId}
                    >
                      <span className={isChildActive(item.children) ? 'text-blue-700' : 'text-gray-400 hover:text-blue-700'}>
                        {item.icon}
                      </span>
                      <span className={`
                        text-[9px] font-medium tracking-wide flex items-center gap-0.5
                        ${isChildActive(item.children) ? 'text-blue-700' : 'text-gray-500'}
                      `}>
                        {item.name}
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    </button>

                    {/* DROPDOWN */}

                    <div
                      id={`dropdown-${item.name}`}
                      className="nav-dropdown absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white shadow-lg border border-gray-200 py-2 z-50 hidden"
                      onMouseEnter={() => handleDropdownMouseEnter(`dropdown-${item.name}`)}
                      onMouseLeave={() => handleDropdownMouseLeave(`dropdown-${item.name}`)}
                    >
                      {item.children.map((child) => (
                        <button
                          key={child.name}
                          onClick={() => handleNavigation(child.href)}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 transition-colors w-full text-left
                            ${isActive(child.href) ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'}
                          `}
                          disabled={isNavigating || !stableId}
                        >
                          <span className={isActive(child.href) ? 'text-blue-700' : 'text-gray-400 hover:text-blue-700'}>
                            {child.icon}
                          </span>
                          <span className="text-sm font-medium tracking-wide">
                            {child.name}
                          </span>
                        </button>
                      ))}
                    </div>

                  </div>

                ) : (

                  <Link
                    href={item.href}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsProfileDropdownOpen(false)
                    }}
                    className={`
                      flex flex-col items-center gap-0.5 min-w-[65px] relative py-1
                      ${isActive(item.href) ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'}
                      ${!stableId ? 'opacity-50 pointer-events-none' : ''}
                    `}
                    prefetch={false}
                  >
                    <span className={isActive(item.href) ? 'text-blue-700' : 'text-gray-400 hover:text-blue-700'}>
                      {item.icon}
                    </span>
                    <span className={`
                      text-[9px] font-medium tracking-wide
                      ${isActive(item.href) ? 'text-blue-700' : 'text-gray-500'}
                    `}>
                      {item.name}
                    </span>
                  </Link>

                )}

              </div>

            ))}

          </div>

          {/* PROFILE SECTION */}

          <div className="flex items-center gap-1.5">

            <div className="relative" ref={profileRef}>

              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="p-2 hover:text-blue-700 transition text-gray-500"
                title={displayName}
                disabled={isNavigating}
              >
                <User className="w-5 h-5" />
              </button>

              {isProfileDropdownOpen && (

                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-200 py-2 z-50">

                  {/* EMPLOYEE INFO */}

                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800 tracking-wide">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 tracking-wide">
                      {displayDesignation}
                    </p>
                  </div>

                  {/* DASHBOARD */}

                  <Link
                    href={stableId ? `/dashboard/${stableId}` : '#'}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 transition-colors text-sm text-gray-700 hover:text-blue-700 w-full tracking-wide
                      ${!stableId ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  {/* Site Visit */}

                  <Link
                    href={stableId ? `/site-visit/${stableId}` : '#'}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 transition-colors text-sm text-gray-700 hover:text-blue-700 w-full tracking-wide
                      ${!stableId ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <MapPin className="w-4 h-4" />
                    Site Visit
                  </Link>

                  {/* ✅ SUBMIT QUERY */}

                  <Link
                    href={stableId ? `/queries/${stableId}` : '#'}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 transition-colors text-sm text-gray-700 hover:text-blue-700 w-full tracking-wide
                      ${!stableId ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Submit Query
                  </Link>

                  {/* ✅ QUERY HISTORY */}

                  <Link
                    href={stableId ? `/query-history/${stableId}` : '#'}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 transition-colors text-sm text-gray-700 hover:text-blue-700 w-full tracking-wide
                      ${!stableId ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <Inbox className="w-4 h-4" />
                    Query History
                  </Link>

                  {/* SETTINGS */}

                  <Link
                    href={stableId ? `/settings/${stableId}` : '#'}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 transition-colors text-sm text-gray-700 hover:text-blue-700 w-full tracking-wide
                      ${!stableId ? 'pointer-events-none opacity-50' : ''}
                    `}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <hr className="my-1 border-gray-200" />

                  {/* LOGOUT */}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 transition-colors text-sm text-red-600 hover:text-red-800 w-full text-left tracking-wide"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      </nav>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      <div
        className={`
          fixed inset-0 z-40 transition-transform duration-300 lg:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* OVERLAY */}

        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* MENU */}

        <div className="relative w-64 h-full bg-white shadow-lg overflow-y-auto flex flex-col">

          {/* HEADER */}

          <div className="flex items-center justify-between p-4 border-b border-gray-200">

            <div className="relative w-24 h-12">
              <Image
                src="/logo.png"
                alt="A to Zee Switchgear Engineering (SMC) Pvt. Ltd."
                fill
                className="object-contain"
              />
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:text-blue-700 transition"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

          </div>

          {/* MOBILE NAV */}

          <nav className="p-3 flex-1 overflow-y-auto">

            <ul className="space-y-0.5">

              {navigation.map((item) => (

                <li key={item.name}>

                  {item.children ? (

                    <div>

                      <button
                        onClick={() => {

                          if (!stableId) return

                          const submenu = document.getElementById(`mobile-submenu-${item.name}`)

                          if (!submenu) return

                          const isOpen = submenu.style.display === 'block'

                          document.querySelectorAll('.mobile-submenu').forEach((el) => {
                            ;(el as HTMLElement).style.display = 'none'
                          })

                          submenu.style.display = isOpen ? 'none' : 'block'
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 transition-colors
                          ${isChildActive(item.children) ? 'text-blue-700' : 'text-gray-600 hover:text-blue-700'}
                        `}
                        disabled={isNavigating || !stableId}
                      >

                        <div className="flex items-center gap-3">
                          <span>{item.icon}</span>
                          <span className="text-sm font-medium tracking-wide">{item.name}</span>
                        </div>

                        <ChevronDown className="w-4 h-4" />

                      </button>

                      {/* SUBMENU */}

                      <div
                        id={`mobile-submenu-${item.name}`}
                        className="mobile-submenu ml-8 mt-1 space-y-0.5 hidden"
                      >

                        {item.children.map((child) => (

                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2 transition-colors
                              ${isActive(child.href) ? 'text-blue-700' : 'text-gray-600 hover:text-blue-700'}
                            `}
                          >
                            {child.icon}
                            <span className="text-sm tracking-wide">{child.name}</span>
                          </Link>

                        ))}

                      </div>

                    </div>

                  ) : (

                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 transition-colors
                        ${isActive(item.href) ? 'text-blue-700 border-l-4 border-blue-700' : 'text-gray-600 hover:text-blue-700'}
                        ${!stableId ? 'pointer-events-none opacity-50' : ''}
                      `}
                      prefetch={false}
                    >
                      {item.icon}
                      <span className="text-sm font-medium tracking-wide">{item.name}</span>
                    </Link>

                  )}

                </li>

              ))}

            </ul>

          </nav>

          {/* MOBILE USER */}

          <div className="p-4 border-t border-gray-200">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-blue-700 flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate tracking-wide">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate tracking-wide">
                  {displayDesignation}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:text-red-600 transition text-gray-400"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* DEVELOPER */}

          <div className="border-t border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500 text-center tracking-wide">
              <span>Developed By: </span>
              <span className="font-medium text-[#0071BD] tracking-wide">
                Muhammad Hassan Jaffer
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* NAVBAR SPACER */}

      <div className="h-16" />

    </>
  )
}