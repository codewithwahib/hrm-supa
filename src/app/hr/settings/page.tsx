// src/app/hr/settings/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import NavbarDropdown from '@/components/navbar'
import { createClient } from '@supabase/supabase-js'
import {
  Settings as SettingsIcon,
  User,
  Search,
  RefreshCw,
  Users,
  Building,
  Lock,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Shield,
  Save,
  ChevronDown,
  ChevronUp,
  Loader,
  UserCheck,
  MapPin,
  Clock
} from 'lucide-react'

// Import Roboto font from Google Fonts using @next/font
import { Roboto } from 'next/font/google'

// Configure Roboto font
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
  phone_number: string
  username: string
  password: string
  enable_site_visits: boolean
  enable_attendance: boolean
}

interface PasswordFormData {
  employeeId: string
  currentUsername: string
  newUsername: string
  newPassword: string
  confirmPassword: string
}

interface PermissionsFormData {
  employeeId: string
  enableSiteVisits: boolean
  enableAttendance: boolean
}

// ✅ Supabase client - MOVED OUTSIDE component (created once)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HRSettingsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [editingPassword, setEditingPassword] = useState<string | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    employeeId: '',
    currentUsername: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [permissionsFormData, setPermissionsFormData] = useState<PermissionsFormData>({
    employeeId: '',
    enableSiteVisits: true,
    enableAttendance: true
  })

  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  
  const [updating, setUpdating] = useState(false)

  // =====================================================
  // applyFilters - useCallback
  // =====================================================

  const applyFilters = useCallback(() => {
    let filtered = [...employees]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.full_name?.toLowerCase().includes(search) ||
        emp.employee_id?.toLowerCase().includes(search) ||
        emp.username?.toLowerCase().includes(search)
      )
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp =>
        emp.department === selectedDepartment
      )
    }

    setFilteredEmployees(filtered)
  }, [employees, searchTerm, selectedDepartment])

  // =====================================================
  // fetchEmployees - UPDATED FOR SUPABASE
  // =====================================================

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching employees from Supabase...')
      
      // ✅ Fetch employees from Supabase with new fields
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('id, employee_id, full_name, department, position, phone_number, username, password, enable_site_visits, enable_attendance')
        .order('full_name', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      console.log('Employees Data:', data)

      // Transform data to match frontend expected format
      const transformedData = data?.map((emp: any) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        department: emp.department || '',
        position: emp.position || '',
        phone_number: emp.phone_number || '',
        username: emp.username || '',
        password: emp.password || '',
        enable_site_visits: emp.enable_site_visits !== undefined ? emp.enable_site_visits : true,
        enable_attendance: emp.enable_attendance !== undefined ? emp.enable_attendance : true
      })) || []

      setEmployees(transformedData)
      
      // Extract departments
      const depts = [...new Set(transformedData
        .map((emp: Employee) => emp.department)
        .filter(Boolean))] as string[]
      setDepartments(depts)

      // Select first employee by default if available
      if (transformedData && transformedData.length > 0) {
        setSelectedEmployeeId(transformedData[0].id)
      }

    } catch (err) {
      console.error('Error fetching employees:', err)
      setError(err instanceof Error ? err.message : 'Failed to load employee data')
    } finally {
      setLoading(false)
    }
  }, [])

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    applyFilters()
  }, [employees, searchTerm, selectedDepartment, applyFilters])

  // =====================================================
  // Toggle Switch Component
  // =====================================================

  const ToggleSwitch = ({
    enabled,
    onChange,
    label,
    description,
    icon: Icon
  }: {
    enabled: boolean
    onChange: () => void
    label: string
    description: string
    icon: any
  }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white shadow-sm">
            <Icon className={`w-4 h-4 ${enabled ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-800 tracking-wide">{label}</h4>
            <p className="text-xs text-gray-500 tracking-wide">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChange}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  // =====================================================
  // HANDLERS - PASSWORD
  // =====================================================

  const handleEditPassword = (employee: Employee) => {
    setEditingPassword(employee.id)
    setEditingPermissions(null)
    setPasswordFormData({
      employeeId: employee.id,
      currentUsername: employee.username || '',
      newUsername: employee.username || '',
      newPassword: '',
      confirmPassword: ''
    })
    setMessage(null)
  }

  const handleCancelPasswordEdit = () => {
    setEditingPassword(null)
    setPasswordFormData({
      employeeId: '',
      currentUsername: '',
      newUsername: '',
      newPassword: '',
      confirmPassword: ''
    })
    setMessage(null)
  }

  // =====================================================
  // HANDLERS - PERMISSIONS
  // =====================================================

  const handleEditPermissions = (employee: Employee) => {
    setEditingPermissions(employee.id)
    setEditingPassword(null)
    setPermissionsFormData({
      employeeId: employee.id,
      enableSiteVisits: employee.enable_site_visits !== undefined ? employee.enable_site_visits : true,
      enableAttendance: employee.enable_attendance !== undefined ? employee.enable_attendance : true
    })
    setMessage(null)
  }

  const handleCancelPermissionsEdit = () => {
    setEditingPermissions(null)
    setPermissionsFormData({
      employeeId: '',
      enableSiteVisits: true,
      enableAttendance: true
    })
    setMessage(null)
  }

  const handlePermissionToggle = (field: 'enableSiteVisits' | 'enableAttendance') => {
    setPermissionsFormData({
      ...permissionsFormData,
      [field]: !permissionsFormData[field]
    })
  }

  // =====================================================
  // handleUpdatePassword - UPDATED FOR SUPABASE
  // =====================================================

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordFormData.newPassword) {
      setMessage({ type: 'error', text: 'Please enter a new password' })
      return
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (passwordFormData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    try {
      setUpdating(true)
      setMessage(null)

      // ✅ Update employee in Supabase
      const updateData: any = {
        password: passwordFormData.newPassword,
        updated_at: new Date().toISOString()
      }

      // Only update username if it has changed
      if (passwordFormData.newUsername && passwordFormData.newUsername !== passwordFormData.currentUsername) {
        // Check if username is taken
        const { data: existingUser, error: checkError } = await supabase
          .from('employees')
          .select('id')
          .eq('username', passwordFormData.newUsername)
          .neq('id', passwordFormData.employeeId)
          .maybeSingle()

        if (checkError) {
          throw new Error(checkError.message)
        }

        if (existingUser) {
          setMessage({ type: 'error', text: 'Username already taken' })
          setUpdating(false)
          return
        }

        updateData.username = passwordFormData.newUsername
      }

      const { data, error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', passwordFormData.employeeId)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      setMessage({ 
        type: 'success', 
        text: `Password updated successfully for ${data?.full_name || 'employee'}` 
      })

      // Update local state
      const updatedEmployees = employees.map(emp => {
        if (emp.id === passwordFormData.employeeId) {
          return {
            ...emp,
            username: data?.username || emp.username,
            password: passwordFormData.newPassword
          }
        }
        return emp
      })
      setEmployees(updatedEmployees)

      setEditingPassword(null)
      setPasswordFormData({
        employeeId: '',
        currentUsername: '',
        newUsername: '',
        newPassword: '',
        confirmPassword: ''
      })

    } catch (err) {
      console.error('Error updating password:', err)
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update password' 
      })
    } finally {
      setUpdating(false)
    }
  }

  // =====================================================
  // handleUpdatePermissions - UPDATED FOR SUPABASE
  // =====================================================

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setUpdating(true)
      setMessage(null)

      // ✅ Update employee permissions in Supabase
      const updateData = {
        enable_site_visits: permissionsFormData.enableSiteVisits,
        enable_attendance: permissionsFormData.enableAttendance,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', permissionsFormData.employeeId)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      setMessage({ 
        type: 'success', 
        text: `Permissions updated successfully for ${data?.full_name || 'employee'}` 
      })

      // Update local state
      const updatedEmployees = employees.map(emp => {
        if (emp.id === permissionsFormData.employeeId) {
          return {
            ...emp,
            enable_site_visits: data?.enable_site_visits !== undefined ? data.enable_site_visits : permissionsFormData.enableSiteVisits,
            enable_attendance: data?.enable_attendance !== undefined ? data.enable_attendance : permissionsFormData.enableAttendance
          }
        }
        return emp
      })
      setEmployees(updatedEmployees)

      setEditingPermissions(null)
      setPermissionsFormData({
        employeeId: '',
        enableSiteVisits: true,
        enableAttendance: true
      })

    } catch (err) {
      console.error('Error updating permissions:', err)
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update permissions' 
      })
    } finally {
      setUpdating(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId)
  }

  const getStatusColor = (hasPassword: boolean) => {
    return hasPassword ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  // =====================================================
  // LOADING
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

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white p-8 shadow-md max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
          <button
            onClick={fetchEmployees}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
  <>

  <ProtectedRoute allowedUser='hr'>
    <NavbarDropdown/>
    <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                System Settings
              </h1>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
            ) : message.type === 'error' ? (
              <X className="w-5 h-5 text-red-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-700' :
                message.type === 'error' ? 'text-red-700' :
                'text-blue-700'
              } tracking-wide`}>
                {message.text}
              </p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Employee List */}
        <div className="space-y-4">
          {filteredEmployees.length === 0 ? (
            <div className="bg-white shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2 tracking-wider">No employees found</h3>
              <p className="text-gray-400 tracking-wide">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredEmployees.map((employee) => {
              const isExpanded = expandedEmployee === employee.id
              const isEditingPassword = editingPassword === employee.id
              const isEditingPermissions = editingPermissions === employee.id
              const hasPassword = !!employee.password

              return (
                <div key={employee.id} className="bg-white shadow-sm overflow-hidden hover:shadow-md transition">
                  {/* Employee Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleEmployee(employee.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <User className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate tracking-wide">
                            {employee.full_name || 'Unknown Employee'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 tracking-wide">
                            <span>ID: {employee.employee_id || 'N/A'}</span>
                            <span className="w-1 h-1 bg-gray-300"></span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {employee.department || 'N/A'}
                            </span>
                            <span className="w-1 h-1 bg-gray-300"></span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {employee.username || 'No username'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${getStatusColor(hasPassword)} tracking-wide`}>
                          <Lock className="w-3 h-3" />
                          {hasPassword ? 'Password Set' : 'No Password'}
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-4">
                        {!isEditingPassword && !isEditingPermissions ? (
                          // View Mode
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider">
                                  <User className="w-4 h-4" />
                                  Personal Information
                                </h4>
                                <div className="bg-gray-50 p-3 space-y-2 text-sm tracking-wide">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Employee ID:</span>
                                    <span className="font-medium text-black">{employee.employee_id || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Full Name:</span>
                                    <span className="font-medium text-black">{employee.full_name || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Department:</span>
                                    <span className="font-medium text-black">{employee.department || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Position:</span>
                                    <span className="font-medium text-black">{employee.position || 'N/A'}</span>
                                  </div>
                                  {employee.phone_number && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Phone:</span>
                                      <span className="font-medium text-black">{employee.phone_number}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider">
                                  <Lock className="w-4 h-4" />
                                  Account & Permissions
                                </h4>
                                <div className="bg-gray-50 p-3 space-y-2 text-sm tracking-wide">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Username:</span>
                                    <span className="font-medium text-black">{employee.username || 'Not set'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-medium flex items-center gap-2">
                                      {hasPassword ? (
                                        <>
                                          <span className="text-green-600">••••••••</span>
                                          <span className="text-xs text-green-600">(Set)</span>
                                        </>
                                      ) : (
                                        <span className="text-red-600">Not set</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Account Status:</span>
                                    <span className={`font-medium ${hasPassword ? 'text-green-600' : 'text-red-600'}`}>
                                      {hasPassword ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>

                                {/* ✅ Site Visits & Attendance - View Mode */}
                                <div className="bg-gray-50 p-3 space-y-2">
                                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 tracking-wider">
                                    <Shield className="w-4 h-4" />
                                    Permissions
                                  </h4>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MapPin className={`w-4 h-4 ${employee.enable_site_visits ? 'text-blue-600' : 'text-gray-400'}`} />
                                      <span className="text-sm text-gray-600 tracking-wide">Site Visits</span>
                                    </div>
                                    <span className={`text-xs font-medium ${employee.enable_site_visits ? 'text-green-600' : 'text-red-500'}`}>
                                      {employee.enable_site_visits ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock className={`w-4 h-4 ${employee.enable_attendance ? 'text-blue-600' : 'text-gray-400'}`} />
                                      <span className="text-sm text-gray-600 tracking-wide">Attendance</span>
                                    </div>
                                    <span className={`text-xs font-medium ${employee.enable_attendance ? 'text-green-600' : 'text-red-500'}`}>
                                      {employee.enable_attendance ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  <button
                                    onClick={() => handleEditPassword(employee)}
                                    className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center justify-center gap-2 tracking-wider text-sm"
                                  >
                                    <Key className="w-4 h-4" />
                                    Change Password
                                  </button>
                                  <button
                                    onClick={() => handleEditPermissions(employee)}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 tracking-wider text-sm"
                                  >
                                    <Shield className="w-4 h-4" />
                                    Edit Permissions
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : isEditingPassword ? (
                          // Edit Mode - Password Change Form
                          <div>
                            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2 tracking-wider">
                              <Key className="w-4 h-4" />
                              Change Password - {employee.full_name}
                            </h4>
                            
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                                  Employee ID
                                </label>
                                <div className="relative">
                                  <UserCheck className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={employee.employee_id || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed tracking-wide"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                                  Username
                                </label>
                                <div className="relative">
                                  <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={passwordFormData.newUsername}
                                    onChange={(e) => setPasswordFormData({ 
                                      ...passwordFormData, 
                                      newUsername: e.target.value 
                                    })}
                                    className="w-full pl-10 pr-4 text-black py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none tracking-wide"
                                    placeholder="Enter username"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 tracking-wide">
                                  Leave unchanged if you don&apos;t want to change the username
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                                  New Password
                                </label>
                                <div className="relative">
                                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordFormData.newPassword}
                                    onChange={(e) => setPasswordFormData({ 
                                      ...passwordFormData, 
                                      newPassword: e.target.value 
                                    })}
                                    className="w-full pl-10 pr-10 text-black py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none tracking-wide"
                                    placeholder="Enter new password (min 6 characters)"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                                  Confirm Password
                                </label>
                                <div className="relative">
                                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordFormData.confirmPassword}
                                    onChange={(e) => setPasswordFormData({ 
                                      ...passwordFormData, 
                                      confirmPassword: e.target.value 
                                    })}
                                    className="w-full pl-10 text-black pr-10 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none tracking-wide"
                                    placeholder="Confirm new password"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="submit"
                                  disabled={updating}
                                  className="flex-1 px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wider"
                                >
                                  {updating ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  {updating ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelPasswordEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="text-xs text-gray-500 flex items-center gap-1 tracking-wide">
                                <AlertCircle className="w-3 h-3" />
                                Password must be at least 6 characters long
                              </div>
                            </form>
                          </div>
                        ) : (
                          // Edit Mode - Permissions Form
                          <div>
                            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2 tracking-wider">
                              <Shield className="w-4 h-4" />
                              Edit Permissions - {employee.full_name}
                            </h4>
                            
                            <form onSubmit={handleUpdatePermissions} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                                  Employee ID
                                </label>
                                <div className="relative">
                                  <UserCheck className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={employee.employee_id || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed tracking-wide"
                                  />
                                </div>
                              </div>

                              {/* ✅ Enable Site Visits & Enable Attendance - Toggle Options */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 tracking-wide mb-2">
                                  Settings & Permissions
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                  <ToggleSwitch
                                    enabled={permissionsFormData.enableSiteVisits}
                                    onChange={() => handlePermissionToggle('enableSiteVisits')}
                                    label="Enable Site Visits"
                                    description="Allow employee to mark site visits"
                                    icon={MapPin}
                                  />
                                  <ToggleSwitch
                                    enabled={permissionsFormData.enableAttendance}
                                    onChange={() => handlePermissionToggle('enableAttendance')}
                                    label="Enable Attendance"
                                    description="Allow employee to mark attendance"
                                    icon={Clock}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="submit"
                                  disabled={updating}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wider"
                                >
                                  {updating ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  {updating ? 'Updating...' : 'Update Permissions'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelPermissionsEdit}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Stats */}
        {filteredEmployees.length > 0 && (
          <div className="mt-6 bg-white shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wide">
              <div>
                Showing {filteredEmployees.length} of {employees.length} employees
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500"></span>
                  <span>With Password: {
                    filteredEmployees.filter(e => e.password).length
                  }</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500"></span>
                  <span>Without Password: {
                    filteredEmployees.filter(e => !e.password).length
                  }</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </ProtectedRoute>
    </>
  )
}