// app/query/[employeeId]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import NavbarDropdown from '@/app/Navbar/page'
import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
import Footer from '@/components/footer'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  MessageCircle,
  AlertCircle,
  Check,
  X,
  Loader,
  ArrowLeft,
  Mail,
  Send,
  HelpCircle,
  Inbox
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
  department?: string
  position?: string
}

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function QueryRequestPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = typeof params.employeeId === 'string' ? params.employeeId : ''

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    department: '',
    designation: '',
    subject: '',
    query: '',
  })

  // =====================================================
  // fetchEmployee
  // =====================================================

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) {
      setError('Employee ID is missing.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('id, employee_id, full_name, department, position')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!data) {
        throw new Error('Employee data not found')
      }

      setEmployee(data)
      setFormData((prev) => ({
        ...prev,
        employeeName: data.full_name || '',
        employeeId: data.employee_id || employeeId,
        department: data.department || '',
        designation: data.position || '',
      }))
    } catch (err) {
      console.error('Employee loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load employee')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  // =====================================================
  // handleChange
  // =====================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // =====================================================
  // handleSubmit - API call to /api/queries
  // =====================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSuccessMessage('')

    if (!formData.employeeId) {
      setError('Employee ID is missing.')
      return
    }
    if (!formData.subject.trim()) {
      setError('Please enter a subject for your query.')
      return
    }
    if (formData.subject.trim().length < 5) {
      setError('Subject must be at least 5 characters.')
      return
    }
    if (!formData.query.trim()) {
      setError('Please describe your query in detail.')
      return
    }
    if (formData.query.trim().length < 20) {
      setError('Please provide a detailed query (minimum 20 characters).')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: formData.employeeId,
          name: formData.employeeName,
          department: formData.department || '',
          designation: formData.designation || '',
          subject: formData.subject.trim(),
          query: formData.query.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit query')
      }

      // ✅ Success
      setSuccess(true)
      setSuccessMessage(`✅ Your query "${formData.subject.trim()}" has been submitted successfully! HR will review it shortly.`)
      
      // Clear form
      setFormData((prev) => ({
        ...prev,
        subject: '',
        query: '',
      }))

      // Auto-hide success message after 8 seconds
      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 8000)

    } catch (err) {
      console.error('Query submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit query')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  if (error && !employee) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ProtectedEmployeeRoute allowedRole='employee'>
        <NavbarDropdown />
        <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  
                  <div>
                    <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                      Submit Query
                    </h1>
                   
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Success Message */}
            {success && (
              <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border-l-4 border-green-500 shadow-md">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-700 tracking-wide font-semibold">
                    ✅ Success!
                  </p>
                  <p className="text-sm text-green-600 tracking-wide mt-1">
                    {successMessage}
                  </p>
                  <p className="text-xs text-green-500 tracking-wide mt-2">
                    You can submit another query or go back to dashboard.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setSuccessMessage('')
                  }}
                  className="flex-shrink-0 text-green-500 hover:text-green-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ❌ Error Message */}
            {error && employee && (
              <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border-l-4 border-red-500 shadow-md">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 tracking-wide font-semibold">❌ Error</p>
                  <p className="text-sm text-red-600 tracking-wide mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Form */}
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#0071BD]" />
                  Query Form
                </h2>
                <p className="text-sm text-gray-500 tracking-wide mt-1">
                  Submit a query to HR department
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Employee Information */}
                <div className="bg-gray-50 p-4 border-l-4 border-[#0071BD]">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
                    <User className="w-4 h-4" />
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm tracking-wide">
                    <div>
                      <p className="text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800 mt-1">{formData.employeeName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Employee ID</p>
                      <p className="font-medium text-gray-800 mt-1">{formData.employeeId || employeeId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Department</p>
                      <p className="font-medium text-gray-800 mt-1 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {formData.department || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Designation</p>
                      <p className="font-medium text-gray-800 mt-1">{formData.designation || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Query Details */}
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
                    <Mail className="w-4 h-4" />
                    Query Details
                  </h3>
                  <div className="grid text-black grid-cols-1 gap-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Subject *
                      </label>
                      <div className="relative">
                        <MessageCircle className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          placeholder="Brief subject of your query"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                      <p className={`text-xs mt-1 tracking-wide ${formData.subject.length < 5 ? 'text-gray-500' : 'text-green-600'}`}>
                        {formData.subject.length}/5 characters minimum
                      </p>
                    </div>

                    {/* Query */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Your Query *
                      </label>
                      <div className="relative">
                        <FileText className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <textarea
                          name="query"
                          value={formData.query}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          rows={5}
                          placeholder="Please describe your query in detail (minimum 20 characters)"
                          className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide resize-none disabled:bg-gray-100"
                        />
                      </div>
                      <p className={`text-xs mt-1 tracking-wide ${formData.query.length < 20 ? 'text-gray-500' : 'text-green-600'}`}>
                        {formData.query.length}/20 characters minimum
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wider"
                  >
                    {submitting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Query'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => router.push(`/dashboard/${employeeId}`)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </form>
            </div>

           
          </div>
        </div>
        <Footer />
      </ProtectedEmployeeRoute>
    </>
  )
}