// src/components/NavbarDropdown.tsx

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
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
  UserPlus,
  FileSpreadsheet,
  Key,
  Users,
  MapPin,
  HelpCircle,
  MessageCircle,
  Inbox,
} from 'lucide-react'

// Import Roboto font
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

export default function NavbarDropdown() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const navigation: NavItem[] = [
    {
      name: 'DASHBOARD',
      href: '/hr/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      name: 'EMPLOYEES',
      href: '/hr/employees',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'ATTENDANCE',
      href: '/hr/attendance',
      icon: <CalendarClock className="w-5 h-5" />
    },
    {
      name: 'LEAVES',
      href: '/hr/leaves',
      icon: <CalendarDays className="w-5 h-5" />
    },
    {
      name: 'SITE VISITS',
      href: '/hr/site-visits',
      icon: <MapPin className="w-5 h-5" />
    },
    // ✅ NEW: QUERIES
    {
      name: 'QUERIES',
      href: '/hr/queries',
      icon: <HelpCircle className="w-5 h-5" />
    },
    {
      name: 'PAYROLL',
      href: '/',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      name: 'SETTINGS',
      href: '/hr/settings',
      icon: <Settings className="w-5 h-5" />
    }
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false)
    setIsMobileMenuOpen(false)
    
    await logout()
    
    localStorage.removeItem('employeeData')
    localStorage.removeItem('employeeLogin')
    
    router.push('/login')
  }

  // Profile dropdown ref
  const profileRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Top Navigation Bar - White Background */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left Section - Logo with Vertical Line */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Logo */}
            <Link href="/hr/dashboard" className="flex items-center">
              <div className="relative w-32 h-16 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="A to Zee Switchgear Engineering (SMC) Pvt. Ltd."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Vertical Line After Logo */}
            <div className="hidden lg:block w-px h-10 bg-gray-300"></div>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 min-w-[65px] relative
                  ${isActive(item.href)
                    ? 'text-blue-700'
                    : 'text-gray-500'
                  }
                `}
              >
                <span className={`
                  transition-colors duration-200
                  ${isActive(item.href) 
                    ? 'text-blue-700' 
                    : 'text-gray-400 hover:text-blue-700'
                  }
                `}>
                  {item.icon}
                </span>
                <span className={`
                  text-[9px] font-medium tracking-wide transition-colors duration-200
                  ${isActive(item.href) ? 'text-blue-700' : 'text-gray-500'}
                `}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5">
            {/* Add Employee Button */}
            <Link
              href="/hr/add-employee"
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-700 flex items-center gap-1"
              title="Add Employee"
            >
              <UserPlus className="w-5 h-5" />
            </Link>

            {/* Get Sheet Button */}
            <Link
              href="/hr/get-sheet"
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-700 flex items-center gap-1"
              title="Get Attendance Sheet"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </Link>

            {/* Vertical Line */}
            <div className="w-px h-6 bg-gray-300 mx-0.5"></div>

            {/* Profile - Icon Only */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-700"
                title="HR Administrator"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">HR Administrator</p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                  
                  <Link
                    href="/hr/employees"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    Employees
                  </Link>

                  {/* ✅ QUERIES - NEW */}
                  <Link
                    href="/hr/queries"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Employee Queries
                  </Link>

                  <Link
                    href="/hr/update-password"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Key className="w-4 h-4" />
                    Update Password
                  </Link>

                  <Link
                    href="/hr/add-employee"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Employee
                  </Link>

                  <Link
                    href="/hr/get-sheet"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Get Sheet
                  </Link>

                  <Link
                    href="/hr/site-visits"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <MapPin className="w-4 h-4" />
                    Site Visits
                  </Link>
                  
                  <Link
                    href="/hr/settings"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700 hover:text-blue-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <hr className="my-1 border-gray-200" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm text-red-600 w-full"
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

      {/* Mobile Menu */}
      <div className={`
        fixed inset-0 z-40 transition-transform duration-300 lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        <div className="relative w-64 h-full bg-white shadow-lg overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="relative w-24 h-12">
                <Image
                  src="/logo.png"
                  alt="A to Zee Switchgear Engineering (SMC) Pvt. Ltd."
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <nav className="p-3 flex-1 overflow-y-auto">
            <ul className="space-y-0.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                      }
                    `}
                  >
                    <span className={`${isActive(item.href) ? 'text-blue-700' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className={`flex-1 text-sm font-medium ${roboto.className} tracking-wide`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/hr/employees"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Employees</span>
              </Link>
              
              {/* ✅ QUERIES - NEW */}
              <Link
                href="/hr/queries"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Employee Queries</span>
              </Link>
              
              <Link
                href="/hr/update-password"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <Key className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Update Password</span>
              </Link>
              <Link
                href="/hr/add-employee"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <UserPlus className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Add Employee</span>
              </Link>
              <Link
                href="/hr/get-sheet"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Get Sheet</span>
              </Link>
              <Link
                href="/hr/site-visits"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-700 transition ${roboto.className} tracking-wide`}
              >
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">Site Visits</span>
              </Link>
            </div>
          </nav>

          {/* Footer in Mobile Menu */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-gray-800 truncate ${roboto.className} tracking-wide`}>HR Administrator</p>
                <p className={`text-xs text-gray-500 truncate ${roboto.className} tracking-wide`}>Admin Panel</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-3">
            <div className={`text-xs text-gray-500 ${roboto.className} tracking-wide text-center`}>
              <span>Developed By: </span>
              <span className="font-medium text-[#0071BD]">Muhammad Hassan Jaffer</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  )
}