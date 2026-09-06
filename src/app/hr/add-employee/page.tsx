// app/hr/add-employee/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import NavbarDropdown from '@/components/navbar'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import {
  User,
  Phone,
  Building,
  Briefcase,
  GraduationCap,
  Calendar,
  MapPin,
  Save,
  X,
  AlertCircle,
  Check,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  IdCard,
  Users,
  Heart,
  FileText,
  Upload,
  File,
  Globe,
  Clock,
} from 'lucide-react'

// Import Roboto font
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

interface Qualification {
  degree: string
  institution: string
  year: string
  grade: string
}

interface Experience {
  company: string
  position: string
  fromDate: string
  toDate: string
  description: string
}

interface EmployeeFormData {
  personalDetails: {
    employeeId: string
    fullName: string
    fatherName: string
    cnicNumber: string
    phoneNumber: string
    emergencyContact: string
    dateOfBirth: string
    maritalStatus: string
    residentialAddress: string
    joiningDate: string
    department: string
    position: string
    source: 'K' | 'PQ'
    enableSiteVisits: boolean
    enableAttendance: boolean
  }
  qualifications: Qualification[]
  experience: Experience[]
  username: string
  password: string
  confirmPassword: string
}

export default function AddEmployeePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvFileName, setCvFileName] = useState('')
  const [cvUploading, setCvUploading] = useState(false)
  
  // Employee ID states
  const [checkingEmployeeId, setCheckingEmployeeId] = useState(false)
  const [employeeIdExists, setEmployeeIdExists] = useState(false)
  const [employeeIdStatus, setEmployeeIdStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const employeeIdCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Username states
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameExists, setUsernameExists] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState<EmployeeFormData>({
    personalDetails: {
      employeeId: '',
      fullName: '',
      fatherName: '',
      cnicNumber: '',
      phoneNumber: '',
      emergencyContact: '',
      dateOfBirth: '',
      maritalStatus: '',
      residentialAddress: '',
      joiningDate: '',
      department: '',
      position: '',
      source: 'K',
      enableSiteVisits: true,
      enableAttendance: true
    },
    qualifications: [],
    experience: [],
    username: '',
    password: '',
    confirmPassword: ''
  })

  // Add qualification
  const [newQualification, setNewQualification] = useState<Qualification>({
    degree: '',
    institution: '',
    year: '',
    grade: ''
  })
  const [showQualificationForm, setShowQualificationForm] = useState(false)

  // Add experience
  const [newExperience, setNewExperience] = useState<Experience>({
    company: '',
    position: '',
    fromDate: '',
    toDate: '',
    description: ''
  })
  const [showExperienceForm, setShowExperienceForm] = useState(false)

  // =====================================================
  // Toggle Handlers
  // =====================================================
  const handleToggle = (field: 'enableSiteVisits' | 'enableAttendance') => {
    setFormData({
      ...formData,
      personalDetails: {
        ...formData.personalDetails,
        [field]: !formData.personalDetails[field]
      }
    })
  }

  // =====================================================
  // Check Employee ID - with abort controller
  // =====================================================
  const checkEmployeeIdExists = async (employeeId: string) => {
    if (!employeeId || employeeId.length < 2) {
      setEmployeeIdExists(false)
      setEmployeeIdStatus('idle')
      return
    }

    setEmployeeIdStatus('checking')
    setCheckingEmployeeId(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `/api/hr/check-employee-id?employeeId=${encodeURIComponent(employeeId)}`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
      
      if (result.exists) {
        setEmployeeIdExists(true)
        setEmployeeIdStatus('exists')
      } else {
        setEmployeeIdExists(false)
        setEmployeeIdStatus('available')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Employee ID check aborted')
      } else {
        console.error('Error checking employee ID:', error)
        setEmployeeIdStatus('idle')
      }
    } finally {
      setCheckingEmployeeId(false)
    }
  }

  // =====================================================
  // Check Username - with abort controller
  // =====================================================
  const checkUsernameExists = async (username: string) => {
    if (!username || username.length < 2) {
      setUsernameExists(false)
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    setCheckingUsername(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `/api/hr/check-username?username=${encodeURIComponent(username)}`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
      
      if (result.exists) {
        setUsernameExists(true)
        setUsernameStatus('exists')
      } else {
        setUsernameExists(false)
        setUsernameStatus('available')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Username check aborted')
      } else {
        console.error('Error checking username:', error)
        setUsernameStatus('idle')
      }
    } finally {
      setCheckingUsername(false)
    }
  }

  // =====================================================
  // Debounced checks - with cleanup
  // =====================================================
  const debouncedCheckEmployeeId = (employeeId: string) => {
    if (employeeIdCheckTimeoutRef.current) {
      clearTimeout(employeeIdCheckTimeoutRef.current)
      employeeIdCheckTimeoutRef.current = null
    }
    const timeout = setTimeout(() => {
      checkEmployeeIdExists(employeeId)
    }, 500)
    employeeIdCheckTimeoutRef.current = timeout
  }

  const debouncedCheckUsername = (username: string) => {
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current)
      usernameCheckTimeoutRef.current = null
    }
    const timeout = setTimeout(() => {
      checkUsernameExists(username)
    }, 500)
    usernameCheckTimeoutRef.current = timeout
  }

  // =====================================================
  // handleInputChange
  // =====================================================
  const handleInputChange = (section: string, field: string, value: string) => {
    // CNIC validation - only allow numbers and max 13 digits
    if (field === 'cnicNumber') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length > 13) return
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: cleaned
        }
      })
      return
    }

    // Phone Number validation - only allow numbers and max 11 digits
    if (field === 'phoneNumber') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length > 11) return
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: cleaned
        }
      })
      return
    }

    // Emergency Contact validation - only allow numbers and max 11 digits
    if (field === 'emergencyContact') {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length > 11) return
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: cleaned
        }
      })
      return
    }

    // Employee ID - check for duplicates with debounce
    if (field === 'employeeId' && section === 'personalDetails') {
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: value
        }
      })
      
      if (value.length < 2) {
        setEmployeeIdStatus('idle')
        setEmployeeIdExists(false)
        return
      }
      
      debouncedCheckEmployeeId(value)
      return
    }

    // Username - check for duplicates with debounce
    if (field === 'username' && section === 'credentials') {
      setFormData({
        ...formData,
        [field]: value
      })
      
      if (value.length < 2) {
        setUsernameStatus('idle')
        setUsernameExists(false)
        return
      }
      
      debouncedCheckUsername(value)
      return
    }

    if (section === 'personalDetails') {
      setFormData({
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          [field]: value
        }
      })
    } else if (section === 'credentials') {
      setFormData({
        ...formData,
        [field]: value
      })
    }
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file')
        setTimeout(() => setError(''), 3000)
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        setTimeout(() => setError(''), 3000)
        return
      }
      
      setCvFile(file)
      setCvFileName(file.name)
    }
  }

  const removeCV = () => {
    setCvFile(null)
    setCvFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addQualification = () => {
    if (newQualification.degree && newQualification.institution) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, newQualification]
      })
      setNewQualification({
        degree: '',
        institution: '',
        year: '',
        grade: ''
      })
      setShowQualificationForm(false)
    }
  }

  const removeQualification = (index: number) => {
    const updated = formData.qualifications.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      qualifications: updated
    })
  }

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setFormData({
        ...formData,
        experience: [...formData.experience, newExperience]
      })
      setNewExperience({
        company: '',
        position: '',
        fromDate: '',
        toDate: '',
        description: ''
      })
      setShowExperienceForm(false)
    }
  }

  const removeExperience = (index: number) => {
    const updated = formData.experience.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      experience: updated
    })
  }

  // =====================================================
  // Upload CV to Supabase
  // =====================================================
  const uploadCV = async (file: File): Promise<string> => {
    try {
      setCvUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      console.log('📤 Uploading CV...')
      
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('❌ Not JSON:', text.substring(0, 200))
        throw new Error('Server returned invalid response')
      }
      
      const result = await response.json()
      console.log('✅ Upload result:', result)
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload CV')
      }
      
      return result.assetId || result.path || result.url
    } catch (error) {
      console.error('❌ Error uploading CV:', error)
      throw error
    } finally {
      setCvUploading(false)
    }
  }

  const validateForm = () => {
    const { personalDetails, username, password, confirmPassword } = formData

    if (!personalDetails.employeeId) {
      setError('Employee ID is required')
      return false
    }
    
    if (employeeIdExists) {
      setError(`❌ Employee ID "${personalDetails.employeeId}" is not available. Please use a different ID.`)
      return false
    }
    
    if (!personalDetails.fullName) {
      setError('Full name is required')
      return false
    }
    if (!personalDetails.fatherName) {
      setError('Father name is required')
      return false
    }
    if (!personalDetails.cnicNumber) {
      setError('CNIC number is required')
      return false
    }
    if (personalDetails.cnicNumber.length !== 13) {
      setError('CNIC number must be exactly 13 digits')
      return false
    }
    if (!personalDetails.phoneNumber) {
      setError('Phone number is required')
      return false
    }
    if (personalDetails.phoneNumber.length !== 11) {
      setError('Phone number must be exactly 11 digits')
      return false
    }
    if (!personalDetails.emergencyContact) {
      setError('Emergency contact is required')
      return false
    }
    if (personalDetails.emergencyContact.length !== 11) {
      setError('Emergency contact must be exactly 11 digits')
      return false
    }
    if (!personalDetails.dateOfBirth) {
      setError('Date of birth is required')
      return false
    }
    if (!personalDetails.maritalStatus) {
      setError('Marital status is required')
      return false
    }
    if (!personalDetails.residentialAddress) {
      setError('Residential address is required')
      return false
    }
    if (!personalDetails.joiningDate) {
      setError('Joining date is required')
      return false
    }
    if (!personalDetails.department) {
      setError('Department is required')
      return false
    }
    if (!personalDetails.position) {
      setError('Position/Designation is required')
      return false
    }
    if (!personalDetails.source) {
      setError('Branch is required')
      return false
    }
    if (!username) {
      setError('Username is required')
      return false
    }
    if (usernameExists) {
      setError(`❌ Username "${username}" is not available. Please choose a different username.`)
      return false
    }
    if (!password) {
      setError('Password is required')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  // =====================================================
  // handleSubmit
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (employeeIdExists) {
      setError(`❌ Employee ID "${formData.personalDetails.employeeId}" is not available. Please use a different ID.`)
      return
    }
    if (usernameExists) {
      setError(`❌ Username "${formData.username}" is not available. Please choose a different username.`)
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      let cvPath = ''
      if (cvFile) {
        try {
          cvPath = await uploadCV(cvFile)
          console.log('✅ CV uploaded successfully:', cvPath)
        } catch (uploadError) {
          setError(`CV Upload Failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
          setLoading(false)
          return
        }
      }

      const payload = {
        personalDetails: {
          employeeId: formData.personalDetails.employeeId.trim(),
          fullName: formData.personalDetails.fullName.trim(),
          fatherName: formData.personalDetails.fatherName.trim() || null,
          cnicNumber: formData.personalDetails.cnicNumber || null,
          phoneNumber: formData.personalDetails.phoneNumber || null,
          emergencyContact: formData.personalDetails.emergencyContact || null,
          dateOfBirth: formData.personalDetails.dateOfBirth || null,
          maritalStatus: formData.personalDetails.maritalStatus || null,
          residentialAddress: formData.personalDetails.residentialAddress.trim() || null,
          joiningDate: formData.personalDetails.joiningDate || null,
          department: formData.personalDetails.department || null,
          position: formData.personalDetails.position.trim() || null,
          source: formData.personalDetails.source || 'K',
          enableSiteVisits: formData.personalDetails.enableSiteVisits,
          enableAttendance: formData.personalDetails.enableAttendance,
          cv: cvPath || null
        },
        qualifications: formData.qualifications || [],
        experience: formData.experience || [],
        username: formData.username.trim(),
        password: formData.password
      }

      console.log('📤 Sending payload:', payload)

      const response = await fetch('/api/hr/add-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('📥 Response:', result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add employee')
      }

      setSuccess('✅ Employee added successfully!')
      
      // Reset form
      setFormData({
        personalDetails: {
          employeeId: '',
          fullName: '',
          fatherName: '',
          cnicNumber: '',
          phoneNumber: '',
          emergencyContact: '',
          dateOfBirth: '',
          maritalStatus: '',
          residentialAddress: '',
          joiningDate: '',
          department: '',
          position: '',
          source: 'K',
          enableSiteVisits: true,
          enableAttendance: true
        },
        qualifications: [],
        experience: [],
        username: '',
        password: '',
        confirmPassword: ''
      })
      setCvFile(null)
      setCvFileName('')
      setEmployeeIdExists(false)
      setEmployeeIdStatus('idle')
      setUsernameExists(false)
      setUsernameStatus('idle')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        router.push('/hr/employees')
      }, 2000)

    } catch (err) {
      console.error('❌ Error adding employee:', err)
      setError(err instanceof Error ? err.message : 'Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  // Cleanup timeouts and abort controllers on unmount
  useEffect(() => {
    return () => {
      if (employeeIdCheckTimeoutRef.current) {
        clearTimeout(employeeIdCheckTimeoutRef.current)
        employeeIdCheckTimeoutRef.current = null
      }
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current)
        usernameCheckTimeoutRef.current = null
      }
    }
  }, [])

  const sections = [
    { id: 1, name: 'Personal Details' },
    { id: 2, name: 'Qualifications' },
    { id: 3, name: 'Experience' },
    { id: 4, name: 'Credentials' }
  ]

  // =====================================================
  // Toggle Switch Component - BLUE COLOR
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
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <Icon className={`w-5 h-5 ${enabled ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-800 tracking-wide">{label}</h4>
            <p className="text-xs text-gray-500 tracking-wide">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChange}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <>
    <ProtectedRoute allowedUser='hr'>
    <NavbarDropdown/>
    <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                  Add Employee
                </h1>
                <p className="text-sm text-gray-500 tracking-wide mt-1">
                  Fill in the employee details to add a new employee
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/hr/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Section Progress */}
        <div className="bg-white shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`px-3 py-2 text-sm tracking-wide transition ${
                  currentSection === section.id
                    ? 'bg-[#0071BD] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 tracking-wide">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border border-green-200">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700 tracking-wide">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Section 1: Personal Details */}
              {currentSection === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-wider mb-6">
                    Personal Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee ID with real-time validation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Employee ID *
                      </label>
                      <div className="relative">
                        <IdCard className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.personalDetails.employeeId}
                          onChange={(e) => handleInputChange('personalDetails', 'employeeId', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black ${
                            employeeIdStatus === 'exists' 
                              ? 'border-red-500 bg-red-50' 
                              : employeeIdStatus === 'available'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Enter employee ID"
                        />
                      </div>
                      {employeeIdStatus === 'checking' && (
                        <p className="text-xs text-blue-600 mt-1 tracking-wide flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Checking availability...
                        </p>
                      )}
                      {employeeIdStatus === 'available' && formData.personalDetails.employeeId.length >= 2 && (
                        <p className="text-xs text-green-600 mt-1 tracking-wide flex items-center gap-1">
                          <Check className="w-3 h-3" />
                           Available
                        </p>
                      )}
                      {employeeIdStatus === 'exists' && (
                        <p className="text-xs text-red-600 mt-1 tracking-wide flex items-center gap-1">
                          <X className="w-3 h-3" />
                         Not Available
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.personalDetails.fullName}
                          onChange={(e) => handleInputChange('personalDetails', 'fullName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Father Name *
                      </label>
                      <div className="relative">
                        <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.personalDetails.fatherName}
                          onChange={(e) => handleInputChange('personalDetails', 'fatherName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter father name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        CNIC Number * <span className="text-gray-400 text-xs">(13 digits)</span>
                      </label>
                      <div className="relative">
                        <FileText className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={13}
                          value={formData.personalDetails.cnicNumber}
                          onChange={(e) => handleInputChange('personalDetails', 'cnicNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter 13-digit CNIC number"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">
                        Enter exactly 13 digits (e.g., 1234567890123)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Phone Number * <span className="text-gray-400 text-xs">(11 digits)</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={11}
                          value={formData.personalDetails.phoneNumber}
                          onChange={(e) => handleInputChange('personalDetails', 'phoneNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter 11-digit phone number"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">
                        Enter exactly 11 digits (e.g., 03001234567)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Emergency Contact * <span className="text-gray-400 text-xs">(11 digits)</span>
                      </label>
                      <div className="relative">
                        <Heart className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={11}
                          value={formData.personalDetails.emergencyContact}
                          onChange={(e) => handleInputChange('personalDetails', 'emergencyContact', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter 11-digit emergency contact"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">
                        Enter exactly 11 digits (e.g., 03001234567)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={formData.personalDetails.dateOfBirth}
                          onChange={(e) => handleInputChange('personalDetails', 'dateOfBirth', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Marital Status *
                      </label>
                      <div className="relative">
                        <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={formData.personalDetails.maritalStatus}
                          onChange={(e) => handleInputChange('personalDetails', 'maritalStatus', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                        >
                          <option value="">Select Marital Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Residential Address *
                      </label>
                      <div className="relative">
                        <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <textarea
                          value={formData.personalDetails.residentialAddress}
                          onChange={(e) => handleInputChange('personalDetails', 'residentialAddress', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          rows={2}
                          placeholder="Enter residential address"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Joining Date *
                      </label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={formData.personalDetails.joiningDate}
                          onChange={(e) => handleInputChange('personalDetails', 'joiningDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Department *
                      </label>
                      <div className="relative">
                        <Building className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={formData.personalDetails.department}
                          onChange={(e) => handleInputChange('personalDetails', 'department', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                        >
                          <option value="">Select Department</option>
                          <option value="HR">HR</option>
                          <option value="IT">IT</option>
                          <option value="Finance">Finance</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="Operations">Operations</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Accounts">Accounts</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Position/Designation *
                      </label>
                      <div className="relative">
                        <Briefcase className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.personalDetails.position}
                          onChange={(e) => handleInputChange('personalDetails', 'position', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter position/designation"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Branch *
                      </label>
                      <div className="relative">
                        <Globe className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={formData.personalDetails.source}
                          onChange={(e) => handleInputChange('personalDetails', 'source', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                        >
                          <option value="K">Korangi</option>
                          <option value="PQ">Port Qasim</option>
                        </select>
                      </div>
                    </div>

                    {/* ✅ Enable Site Visits & Enable Attendance - BLUE Toggle Options */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-2">
                        Settings & Permissions
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ToggleSwitch
                          enabled={formData.personalDetails.enableSiteVisits}
                          onChange={() => handleToggle('enableSiteVisits')}
                          label="Enable Site Visits"
                          description="Allow employee to mark site visits"
                          icon={MapPin}
                        />
                        <ToggleSwitch
                          enabled={formData.personalDetails.enableAttendance}
                          onChange={() => handleToggle('enableAttendance')}
                          label="Enable Attendance"
                          description="Allow employee to mark attendance"
                          icon={Clock}
                        />
                      </div>
                    </div>

                    {/* CV Upload Field - Optional */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        CV / Resume (PDF) <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleCVUpload}
                          className="hidden"
                          id="cv-upload"
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition border border-gray-300 flex items-center gap-2 tracking-wide"
                          >
                            <Upload className="w-4 h-4" />
                            Choose PDF File
                          </button>
                          {cvFileName && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                              <File className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700 tracking-wide truncate max-w-[200px]">
                                {cvFileName}
                              </span>
                              <button
                                type="button"
                                onClick={removeCV}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {!cvFileName && (
                            <span className="text-sm text-gray-500 tracking-wide">
                              No file selected (PDF only, max 10MB) - Optional
                            </span>
                          )}
                        </div>
                        {cvUploading && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Uploading CV...
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">
                        Upload employee CV/Resume in PDF format (Max size: 10MB) - Optional
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Qualifications */}
              {currentSection === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 tracking-wider">
                      Qualifications
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowQualificationForm(!showQualificationForm)}
                      className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
                    >
                      {showQualificationForm ? 'Cancel' : 'Add Qualification'}
                    </button>
                  </div>

                  {showQualificationForm && (
                    <div className="bg-gray-50 p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Degree/Certification *
                          </label>
                          <input
                            type="text"
                            value={newQualification.degree}
                            onChange={(e) => setNewQualification({ ...newQualification, degree: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="e.g., B.Tech, MBA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Institution *
                          </label>
                          <input
                            type="text"
                            value={newQualification.institution}
                            onChange={(e) => setNewQualification({ ...newQualification, institution: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="Enter institution name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Year
                          </label>
                          <input
                            type="text"
                            value={newQualification.year}
                            onChange={(e) => setNewQualification({ ...newQualification, year: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="e.g., 2020"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Grade
                          </label>
                          <input
                            type="text"
                            value={newQualification.grade}
                            onChange={(e) => setNewQualification({ ...newQualification, grade: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="e.g., A, 85%"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={addQualification}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition tracking-wider"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQualificationForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.qualifications.length > 0 ? (
                    <div className="space-y-3">
                      {formData.qualifications.map((qual, index) => (
                        <div key={index} className="bg-gray-50 p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 tracking-wide">{qual.degree}</p>
                            <p className="text-sm text-gray-600 tracking-wide">{qual.institution}</p>
                            <p className="text-sm text-gray-600 tracking-wide">
                              {qual.year} {qual.grade ? `• ${qual.grade}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQualification(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50">
                      <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 tracking-wide">No qualifications added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Experience */}
              {currentSection === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 tracking-wider">
                      Work Experience
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowExperienceForm(!showExperienceForm)}
                      className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
                    >
                      {showExperienceForm ? 'Cancel' : 'Add Experience'}
                    </button>
                  </div>

                  {showExperienceForm && (
                    <div className="bg-gray-50 p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Company *
                          </label>
                          <input
                            type="text"
                            value={newExperience.company}
                            onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Position *
                          </label>
                          <input
                            type="text"
                            value={newExperience.position}
                            onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            placeholder="Enter position"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={newExperience.fromDate}
                            onChange={(e) => setNewExperience({ ...newExperience, fromDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={newExperience.toDate}
                            onChange={(e) => setNewExperience({ ...newExperience, toDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                            Description
                          </label>
                          <textarea
                            value={newExperience.description}
                            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                            rows={2}
                            placeholder="Brief description of your role and responsibilities"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={addExperience}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition tracking-wider"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExperienceForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.experience.length > 0 ? (
                    <div className="space-y-3">
                      {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 tracking-wide">{exp.position}</p>
                            <p className="text-sm text-gray-600 tracking-wide">{exp.company}</p>
                            <p className="text-sm text-gray-600 tracking-wide">
                              {exp.fromDate && exp.toDate 
                                ? `${new Date(exp.fromDate).getFullYear()} - ${new Date(exp.toDate).getFullYear()}`
                                : 'Date not specified'}
                            </p>
                            {exp.description && (
                              <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExperience(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 tracking-wide">No experience added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section 4: Credentials */}
              {currentSection === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-wider mb-6">
                    Login Credentials
                  </h2>
                  <div className="space-y-4">
                    {/* Username with real-time validation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Username *
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('credentials', 'username', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black ${
                            usernameStatus === 'exists' 
                              ? 'border-red-500 bg-red-50' 
                              : usernameStatus === 'available'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Enter username"
                        />
                      </div>
                      {usernameStatus === 'checking' && (
                        <p className="text-xs text-blue-600 mt-1 tracking-wide flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Checking availability...
                        </p>
                      )}
                      {usernameStatus === 'available' && formData.username.length >= 2 && (
                        <p className="text-xs text-green-600 mt-1 tracking-wide flex items-center gap-1">
                          <Check className="w-3 h-3" />
                           Available
                        </p>
                      )}
                      {usernameStatus === 'exists' && (
                        <p className="text-xs text-red-600 mt-1 tracking-wide flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Not Available
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('credentials', 'password', e.target.value)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Enter password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">
                        Password must be at least 6 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('credentials', 'confirmPassword', e.target.value)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide text-black"
                          placeholder="Confirm password"
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
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex flex-wrap gap-3">
                {currentSection > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentSection(currentSection - 1)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                  >
                    Previous
                  </button>
                )}
                
                {currentSection < 4 && (
                  <button
                    type="button"
                    onClick={() => setCurrentSection(currentSection + 1)}
                    className="px-6 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
                  >
                    Next
                  </button>
                )}

                {currentSection === 4 && (
                  <button
                    type="submit"
                    disabled={loading || cvUploading || employeeIdExists || checkingEmployeeId || usernameExists || checkingUsername}
                    className="flex-1 px-6 py-2 bg-blue-800 text-white hover:bg-blue-900 transition flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || cvUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {cvUploading ? 'Uploading CV...' : loading ? 'Saving...' : 'Save Employee'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    <Footer/>
    </ProtectedRoute>
    </>
  )
}