// src/app/query-history/[employeeId]/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Footer from '@/components/footer'
import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
import NavbarDropdown from '@/app/Navbar/page'
import {
  Calendar,
  Clock,
  User,
  Building,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader,
  FileText,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  UserCircle,
  ListChecks,
  Search,
  X,
  MessageCircle,
  CheckCircle,
  XCircle,
  Activity,
  Inbox,
  Eye,
  HelpCircle,
  Send,
  Mail,
  Clock as ClockIcon
} from 'lucide-react'

// Import Roboto font
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

// =====================================================
// TYPES
// =====================================================

interface QueryRecord {
  id: string
  employee_id: string
  name: string
  department: string
  designation: string
  subject: string
  query: string
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected'
  admin_remarks?: string
  created_at: string
  updated_at: string
}

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function QueryHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  const [queries, setQueries] = useState<QueryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredQueries, setFilteredQueries] = useState<QueryRecord[]>([])
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedFilters, setExpandedFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<'all' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'>('all')
  
  // Employee info
  const [employeeName, setEmployeeName] = useState<string>('')
  const [employeeDepartment, setEmployeeDepartment] = useState<string>('')
  const [employeeDesignation, setEmployeeDesignation] = useState<string>('')

  // =====================================================
  // FETCH QUERIES
  // =====================================================

  const fetchQueries = useCallback(async () => {
    if (!employeeId) {
      setError('Employee ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // ✅ Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('full_name, department, position')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (employeeError) {
        console.error('Error fetching employee:', employeeError)
      }

      if (employeeData) {
        setEmployeeName(employeeData.full_name || '')
        setEmployeeDepartment(employeeData.department || '')
        setEmployeeDesignation(employeeData.position || '')
      }

      // ✅ Fetch queries for this employee
      const { data, error } = await supabase
        .from('employee_queries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setQueries(data || [])
      setFilteredQueries(data || [])
    } catch (err) {
      console.error('Error fetching queries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load query history')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  // =====================================================
  // APPLY FILTERS
  // =====================================================

  useEffect(() => {
    let filtered = [...queries]

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => q.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(q =>
        q.subject?.toLowerCase().includes(term) ||
        q.query?.toLowerCase().includes(term) ||
        q.status?.toLowerCase().includes(term)
      )
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
          filtered = filtered.filter(q => {
            const created = new Date(q.created_at || '')
            return created >= startDate && created <= lastMonthEnd
          })
          setFilteredQueries(filtered)
          return
        case 'last3Months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }
      
      filtered = filtered.filter(q => {
        const created = new Date(q.created_at || '')
        return created >= startDate
      })
    }

    setFilteredQueries(filtered)
  }, [queries, filterStatus, searchTerm, dateRange])

  // =====================================================
  // FORMAT FUNCTIONS
  // =====================================================

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'Rejected':
        return <XCircle className="w-4 h-4" />
      case 'In Progress':
        return <Activity className="w-4 h-4" />
      case 'Pending':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  // =====================================================
  // SUMMARY STATS
  // =====================================================

  const getSummary = () => {
    const total = queries.length
    const pending = queries.filter(q => q.status === 'Pending').length
    const inProgress = queries.filter(q => q.status === 'In Progress').length
    const resolved = queries.filter(q => q.status === 'Resolved').length
    const rejected = queries.filter(q => q.status === 'Rejected').length

    return { total, pending, inProgress, resolved, rejected }
  }

  const summary = getSummary()

  // =====================================================
  // EXPAND
  // =====================================================

  const toggleExpand = (id: string) => {
    setExpandedQuery(expandedQuery === id ? null : id)
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <>
        <ProtectedEmployeeRoute allowedRole='employee'>
          <NavbarDropdown />
          <div className={`flex items-center justify-center min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
            <div className="text-center bg-white shadow-sm p-8 max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
              <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
              <button
                onClick={fetchQueries}
                className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
          <Footer />
        </ProtectedEmployeeRoute>
      </>
    )
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <>
      <ProtectedEmployeeRoute allowedRole='employee'>
        <NavbarDropdown />
        <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
          <div className="max-w-7xl mx-auto">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  
                  <div>
                    <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
                      Query History
                    </h1>
                    
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={fetchQueries}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 tracking-wider rounded"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => router.push(`/queries/${employeeId}`)}
                    className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 tracking-wider rounded"
                  >
                    <Send className="w-4 h-4" />
                    New Query
                  </button>
                </div>
              </div>
            </div>

            {/* =====================================================
                EMPLOYEE QUICK INFO
            ===================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCircle className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium">Employee</span>
                </div>
                <div className="text-lg font-semibold text-gray-800 mt-1 tracking-wide">
                  {employeeName || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">ID: {employeeId}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium">Department</span>
                </div>
                <div className="text-lg font-semibold text-gray-800 mt-1 tracking-wide">
                  {employeeDepartment || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">{employeeDesignation || 'N/A'}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <HelpCircle className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium">Total Queries</span>
                </div>
                <div className="text-lg font-semibold text-gray-800 mt-1 tracking-wide">
                  {summary.total}
                </div>
                <div className="text-sm text-gray-500">{summary.pending} Pending</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-[#0071BD]" />
                  <span className="font-medium">Resolved</span>
                </div>
                <div className="text-lg font-semibold text-gray-800 mt-1 tracking-wide">
                  {summary.resolved}
                </div>
                <div className="text-sm text-gray-500">{summary.rejected} Rejected</div>
              </div>
            </div>

            {/* =====================================================
                SUMMARY CARDS
            ===================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-[#0071BD] tracking-wide">Total</div>
                <div className="text-2xl font-bold text-[#0071BD] tracking-wider">{summary.total}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-yellow-600 tracking-wide flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" /> Pending
                </div>
                <div className="text-2xl font-bold text-yellow-700 tracking-wider">{summary.pending}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-blue-600 tracking-wide flex items-center gap-1">
                  <Activity className="w-4 h-4" /> In Progress
                </div>
                <div className="text-2xl font-bold text-blue-700 tracking-wider">{summary.inProgress}</div>
              </div>
              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-green-600 tracking-wide flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Resolved
                </div>
                <div className="text-2xl font-bold text-green-700 tracking-wider">{summary.resolved}</div>
              </div>
            </div>

            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="bg-white text-black shadow-sm p-4 mb-6">
              <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-[#0071BD] transition tracking-wider"
              >
                <Filter className="w-4 h-4" />
                {expandedFilters ? 'Hide Filters' : 'Show Filters'}
                {expandedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    >
                      <option value="all">All Time</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="last3Months">Last 3 Months</option>
                      <option value="thisYear">This Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search queries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="text-sm text-gray-500 tracking-wide">
                      Showing {filteredQueries.length} of {queries.length} queries
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================
                RESULTS INFO
            ===================================================== */}

            <div className="bg-white shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ListChecks className="w-5 h-5 text-[#0071BD]" />
                  <span className="font-medium text-gray-700 tracking-wide">
                    {filteredQueries.length} query records found
                  </span>
                  {filterStatus !== 'all' && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wide">
                      Filtered by: {filterStatus}
                    </span>
                  )}
                  {dateRange !== 'all' && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded tracking-wide">
                      {dateRange.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 tracking-wide">
                  Showing {filteredQueries.length} of {queries.length} total
                </div>
              </div>
            </div>

            {/* =====================================================
                QUERY TABLE
            ===================================================== */}

            <div className="bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredQueries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="w-12 h-12 text-gray-300" />
                            <p className="tracking-wide">No query records found</p>
                            <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredQueries.map((query, index) => {
                        const isExpanded = expandedQuery === query.id

                        return (
                          <tr key={query.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-sm text-gray-500 tracking-wide">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-[#0071BD]" />
                                <span className="text-sm font-medium text-gray-800 tracking-wide cursor-pointer hover:text-[#0071BD]" onClick={() => toggleExpand(query.id)}>
                                  {query.subject || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-600 max-w-xs truncate" title={query.query}>
                                {query.query ? (query.query.length > 60 ? query.query.substring(0, 60) + '...' : query.query) : 'No query details'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium tracking-wide rounded-full ${getStatusColor(query.status)}`}>
                                {getStatusIcon(query.status)}
                                {query.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 tracking-wide">
                              {formatDateTime(query.created_at)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleExpand(query.id)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-[#0071BD]"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =====================================================
                EXPANDED QUERY DETAILS
            ===================================================== */}

            {expandedQuery && (
              <div className="mt-4 bg-white shadow-sm overflow-hidden border-t-4 border-[#0071BD]">
                {filteredQueries.filter(q => q.id === expandedQuery).map((query) => (
                  <div key={query.id} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Query Details */}
                      <div>
                        <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-3">
                          <MessageCircle className="w-4 h-4 text-[#0071BD]" />
                          Subject
                        </h4>
                        <div className="bg-gray-50 p-3 text-sm text-gray-700 min-h-[40px] tracking-wide font-medium rounded">
                          {query.subject || 'No subject'}
                        </div>

                        <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mt-4 mb-3">
                          <FileText className="w-4 h-4 text-[#0071BD]" />
                          Query Details
                        </h4>
                        <div className="bg-gray-50 p-3 text-sm text-gray-700 min-h-[80px] tracking-wide rounded">
                          {query.query || 'No query details provided'}
                        </div>

                        {query.admin_remarks && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-2">
                              <Mail className="w-4 h-4 text-[#0071BD]" />
                              Admin Remarks
                            </h4>
                            <div className="bg-blue-50 p-3 text-sm text-blue-700 tracking-wide border-l-4 border-blue-500 rounded">
                              {query.admin_remarks}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Query Info */}
                      <div>
                        <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-3">
                          <Calendar className="w-4 h-4 text-[#0071BD]" />
                          Query Information
                        </h4>

                        <div className="space-y-3 text-sm tracking-wide">
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Status:</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium tracking-wide rounded-full ${getStatusColor(query.status)}`}>
                              {getStatusIcon(query.status)}
                              {query.status || 'Pending'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Submitted:</span>
                            <span className="text-gray-700">{formatDateTime(query.created_at)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Last Updated:</span>
                            <span className="text-gray-700">{formatDateTime(query.updated_at)}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Query ID:</span>
                            <span className="text-gray-500 text-xs font-mono">{query.id}</span>
                          </div>
                        </div>

                        {/* Employee Info */}
                        <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mt-4 mb-3">
                          <User className="w-4 h-4 text-[#0071BD]" />
                          Employee Information
                        </h4>

                        <div className="space-y-2 text-sm tracking-wide bg-gray-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Employee ID:</span>
                            <span className="font-medium">{query.employee_id || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Name:</span>
                            <span className="font-medium">{query.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Department:</span>
                            <span>{query.department || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Designation:</span>
                            <span>{query.designation || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={() => setExpandedQuery(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider rounded"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* =====================================================
                FOOTER STATS
            ===================================================== */}

            {filteredQueries.length > 0 && (
              <div className="mt-6 bg-white shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wide">
                  <div>
                    Showing {filteredQueries.length} records
                    {employeeName && ` for ${employeeName}`}
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                      <ClockIcon className="w-3 h-3 text-yellow-500" />
                      Pending: {summary.pending}
                    </span>
                    <span className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-blue-500" />
                      In Progress: {summary.inProgress}
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Resolved: {summary.resolved}
                    </span>
                    <span className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-500" />
                      Rejected: {summary.rejected}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </ProtectedEmployeeRoute>
    </>
  )
}