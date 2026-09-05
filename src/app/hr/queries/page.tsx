// app/hr/queries/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import NavbarDropdown from '@/components/navbar'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import { format, parseISO } from 'date-fns'
import {
  Calendar,
  Clock,
  User,
  Building,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  Loader,
  XCircle,
  AlertCircle,
  Trash2,
  MessageCircle,
  FileText,
  Clock as ClockIcon,
  Check,
  X,
  Inbox,
  Activity
} from 'lucide-react'

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

interface FilterOptions {
  status: string
  department: string
  search: string
  fromDate: string
  toDate: string
}

// =====================================================
// PAGE
// =====================================================

export default function HRQueryManagementPage() {
  const [queries, setQueries] = useState<QueryRecord[]>([])
  const [filteredQueries, setFilteredQueries] = useState<QueryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  })

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    department: 'all',
    search: '',
    fromDate: '',
    toDate: ''
  })

  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null)
  const [actionType, setActionType] = useState<'resolve' | 'reject' | 'inprogress' | 'delete'>('resolve')
  const [adminRemarks, setAdminRemarks] = useState('')
  const [updating, setUpdating] = useState(false)
  const [modalError, setModalError] = useState('')

  // =====================================================
  // UPDATE STATS
  // =====================================================

  const updateStats = useCallback((data: QueryRecord[]) => {
    setStats({
      total: data.length,
      pending: data.filter((q) => q.status === 'Pending').length,
      inProgress: data.filter((q) => q.status === 'In Progress').length,
      resolved: data.filter((q) => q.status === 'Resolved').length,
      rejected: data.filter((q) => q.status === 'Rejected').length
    })
  }, [])

  // =====================================================
  // APPLY FILTERS
  // =====================================================

  const applyFilters = useCallback(() => {
    let filtered = [...queries]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.name?.toLowerCase().includes(search) ||
          q.employee_id?.toLowerCase().includes(search) ||
          q.subject?.toLowerCase().includes(search) ||
          q.department?.toLowerCase().includes(search) ||
          q.query?.toLowerCase().includes(search)
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((q) => q.status === filters.status)
    }

    if (filters.department !== 'all') {
      filtered = filtered.filter((q) => q.department === filters.department)
    }

    if (filters.fromDate) {
      filtered = filtered.filter((q) => q.created_at >= filters.fromDate)
    }

    if (filters.toDate) {
      filtered = filtered.filter((q) => q.created_at <= filters.toDate)
    }

    setFilteredQueries(filtered)
  }, [queries, filters])

  // =====================================================
  // FETCH QUERIES - API call
  // =====================================================

  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.department !== 'all') params.append('department', filters.department)
      if (filters.fromDate) params.append('fromDate', filters.fromDate)
      if (filters.toDate) params.append('toDate', filters.toDate)

      const response = await fetch(`/api/hr/queries?${params.toString()}`, { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch queries')
      }

      const normalizedQueries: QueryRecord[] = result.data || []
      setQueries(normalizedQueries)

      // Extract departments
      const depts = [
        ...new Set(
          normalizedQueries
            .map((q) => q.department)
            .filter(Boolean)
        )
      ]
      setDepartments(depts)

      updateStats(normalizedQueries)
    } catch (err) {
      console.error('Error fetching queries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load query data')
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.department, filters.fromDate, filters.toDate, updateStats])

  // =====================================================
  // USE EFFECTS
  // =====================================================

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  useEffect(() => {
    applyFilters()
  }, [queries, filters, applyFilters])

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700'
      case 'Resolved':
        return 'bg-green-100 text-green-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="w-4 h-4" />
      case 'In Progress':
        return <Activity className="w-4 h-4" />
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'Rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    try {
      return format(parseISO(date), 'MMM dd, yyyy')
    } catch {
      return date
    }
  }

  const formatDateTime = (date: string) => {
    if (!date) return 'N/A'
    try {
      return format(parseISO(date), 'MMM dd, yyyy hh:mm a')
    } catch {
      return date
    }
  }

  // =====================================================
  // EXPAND
  // =====================================================

  const toggleExpand = (id: string) => {
    setExpandedQuery(expandedQuery === id ? null : id)
  }

  // =====================================================
  // UPDATE STATUS - API call
  // =====================================================

  const handleStatusUpdate = async (
    query: QueryRecord,
    status: 'In Progress' | 'Resolved' | 'Rejected'
  ) => {
    try {
      setUpdating(true)
      setModalError('')

      console.log('🟢 Updating query via API:', { id: query.id, status, adminRemarks })

      const response = await fetch('/api/hr/queries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: query.id,
          status: status,
          adminRemarks: adminRemarks || null,
        }),
      })

      const result = await response.json()

      console.log('🟢 API Response:', result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update query')
      }

      // Update local state
      const updatedQuery: QueryRecord = result.data || {
        ...query,
        status,
        admin_remarks: adminRemarks || query.admin_remarks,
        updated_at: new Date().toISOString()
      }

      const updatedQueries = queries.map((item) =>
        item.id === query.id ? updatedQuery : item
      )

      setQueries(updatedQueries)
      updateStats(updatedQueries)

      setShowActionModal(false)
      setAdminRemarks('')
      setSelectedQuery(null)
      setModalError('')

      alert(`✅ Query ${status} successfully!`)
    } catch (err) {
      console.error('❌ Error updating query:', err)
      setModalError(err instanceof Error ? err.message : 'Failed to update query status')
    } finally {
      setUpdating(false)
    }
  }

  // =====================================================
  // DELETE - API call
  // =====================================================

  const handleDeleteQuery = async (query: QueryRecord) => {
    try {
      setUpdating(true)
      setModalError('')

      const response = await fetch(`/api/hr/queries?id=${query.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete query')
      }

      // Remove from local state
      const updatedQueries = queries.filter((item) => item.id !== query.id)

      setQueries(updatedQueries)
      updateStats(updatedQueries)

      setShowActionModal(false)
      setSelectedQuery(null)
      setModalError('')

      alert('✅ Query deleted successfully!')
    } catch (err) {
      console.error('Error deleting query:', err)
      setModalError(err instanceof Error ? err.message : 'Failed to delete query')
    } finally {
      setUpdating(false)
    }
  }

  // =====================================================
  // MODAL
  // =====================================================

  const openActionModal = (
    query: QueryRecord,
    action: 'resolve' | 'reject' | 'inprogress' | 'delete'
  ) => {
    setSelectedQuery(query)
    setActionType(action)
    setAdminRemarks('')
    setModalError('')
    setShowActionModal(true)
  }

  // =====================================================
  // SEARCH CLEAR
  // =====================================================

  const clearSearch = () => {
    setFilters({
      ...filters,
      search: ''
    })
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
        <div className="text-center bg-white shadow-sm p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
          <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
          <button
            onClick={fetchQueries}
            className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <ProtectedRoute allowedUser='hr'>
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
                      Employee Queries
                    </h1>
                    
                  </div>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, subject..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        search: e.target.value
                      })
                    }
                    className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                  />
                  {filters.search && (
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

            {/* =====================================================
                STATS
            ===================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-[#0071BD] tracking-wide">Total</div>
                <div className="text-2xl font-bold text-[#0071BD] tracking-wider">{stats.total}</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-yellow-600 tracking-wide">Pending</div>
                <div className="text-2xl font-bold text-yellow-700 tracking-wider">{stats.pending}</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-blue-600 tracking-wide">In Progress</div>
                <div className="text-2xl font-bold text-blue-700 tracking-wider">{stats.inProgress}</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-green-600 tracking-wide">Resolved</div>
                <div className="text-2xl font-bold text-green-700 tracking-wider">{stats.resolved}</div>
              </div>

              <div className="bg-white shadow-sm p-4">
                <div className="text-sm text-red-600 tracking-wide">Rejected</div>
                <div className="text-2xl font-bold text-red-700 tracking-wider">{stats.rejected}</div>
              </div>
            </div>

            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="bg-white text-gray-800 shadow-sm p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        status: e.target.value
                      })
                    }
                    className="w-full px-4 text-gray-800 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        department: e.target.value
                      })
                    }
                    className="w-full px-4 py-2 border text-gray-800 border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Date */}
                <div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          fromDate: e.target.value
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    />
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          toDate: e.target.value
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* =====================================================
                QUERY LIST
            ===================================================== */}

            <div className="space-y-4">
              {filteredQueries.length === 0 ? (
                <div className="bg-white shadow-sm p-12 text-center">
                  <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2 tracking-wider">
                    No queries found
                  </h3>
                  <p className="text-gray-400 tracking-wide">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              ) : (
                filteredQueries.map((query) => {
                  const isExpanded = expandedQuery === query.id

                  return (
                    <div
                      key={query.id}
                      className="bg-white shadow-sm overflow-hidden hover:shadow-md transition"
                    >
                      {/* =====================================================
                          HEADER
                      ===================================================== */}

                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => toggleExpand(query.id)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center text-gray-400 flex-shrink-0">
                              <User className="w-8 h-8" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate tracking-wide">
                                {query.name || 'Unknown'}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 tracking-wide">
                                <span>ID: {query.employee_id || 'N/A'}</span>
                                <span className="w-1 h-1 bg-gray-300"></span>
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {query.department || 'N/A'}
                                </span>
                                <span className="w-1 h-1 bg-gray-300"></span>
                                <span className="text-xs text-gray-400">
                                  {query.designation || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <span className="text-sm text-gray-500 tracking-wide">
                              {formatDate(query.created_at)}
                            </span>
                            <div
                              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${getStatusColor(
                                query.status
                              )} tracking-wide`}
                            >
                              {getStatusIcon(query.status)}
                              {query.status}
                            </div>
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* =====================================================
                          DETAILS
                      ===================================================== */}

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Query Details */}
                            <div>
                              <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-3">
                                <MessageCircle className="w-4 h-4" />
                                Subject
                              </h4>

                              <div className="bg-gray-50 p-3 text-sm text-gray-700 min-h-[40px] tracking-wide font-medium">
                                {query.subject || 'No subject'}
                              </div>

                              <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mt-4 mb-3">
                                <FileText className="w-4 h-4" />
                                Query Details
                              </h4>

                              <div className="bg-gray-50 p-3 text-sm text-gray-700 min-h-[80px] tracking-wide">
                                {query.query || 'No query details provided'}
                              </div>

                              {query.admin_remarks && (
                                <div className="mt-3">
                                  <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-2">
                                    Admin Remarks
                                  </h4>
                                  <div className="bg-blue-50 p-3 text-sm text-blue-700 tracking-wide border-l-4 border-blue-500">
                                    {query.admin_remarks}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Employee Info */}
                            <div>
                              <h4 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-3">
                                <User className="w-4 h-4" />
                                Employee Information
                              </h4>

                              <div className="space-y-2 text-sm tracking-wide">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Employee ID:</span>
                                  <span className="font-medium text-gray-500 ">{query.employee_id || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Name:</span>
                                  <span className="font-medium text-gray-500">{query.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Department:</span>
                                  <span className='text-gray-500'>{query.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Designation:</span>
                                  <span className='text-gray-500'>{query.designation || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Submitted:</span>
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(query.created_at)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Last Updated:</span>
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(query.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* =====================================================
                              ACTION BUTTONS
                          ===================================================== */}

                          <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                            {/* ✅ In Progress Button - Only show for Pending */}
                            {query.status === 'Pending' && (
                              <button
                                onClick={() => openActionModal(query, 'inprogress')}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 tracking-wider rounded"
                              >
                                <Activity className="w-4 h-4" />
                                In Progress
                              </button>
                            )}

                            {/* Resolve - Show for Pending & In Progress */}
                            {(query.status === 'Pending' || query.status === 'In Progress') && (
                              <button
                                onClick={() => openActionModal(query, 'resolve')}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2 tracking-wider rounded"
                              >
                                <Check className="w-4 h-4" />
                                Resolve
                              </button>
                            )}

                            {/* Reject - Show for Pending & In Progress */}
                            {(query.status === 'Pending' || query.status === 'In Progress') && (
                              <button
                                onClick={() => openActionModal(query, 'reject')}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2 tracking-wider rounded"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            )}

                            {/* Delete - Show for all statuses */}
                            <button
                              onClick={() => openActionModal(query, 'delete')}
                              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition flex items-center gap-2 tracking-wider rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* =====================================================
                FOOTER STATS
            ===================================================== */}

            {filteredQueries.length > 0 && (
              <div className="mt-6 bg-white shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 tracking-wide">
                  <div>
                    Showing {filteredQueries.length} of {queries.length} queries
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                      Pending: {stats.pending}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded"></span>
                      In Progress: {stats.inProgress}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded"></span>
                      Resolved: {stats.resolved}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded"></span>
                      Rejected: {stats.rejected}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              ACTION MODAL
          ===================================================== */}

          {showActionModal && selectedQuery && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white shadow-sm max-w-md w-full p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 tracking-wider mb-2">
                  {actionType === 'resolve'
                    ? 'Resolve Query'
                    : actionType === 'reject'
                    ? 'Reject Query'
                    : actionType === 'inprogress'
                    ? 'Move to In Progress'
                    : 'Delete Query'}
                </h3>

                <p className="text-gray-600 tracking-wide mb-4">
                  {actionType === 'resolve'
                    ? `Mark query as resolved for ${selectedQuery.name}`
                    : actionType === 'reject'
                    ? `Reject query from ${selectedQuery.name}`
                    : actionType === 'inprogress'
                    ? `Move query to In Progress for ${selectedQuery.name}`
                    : `Delete query from ${selectedQuery.name}`}
                </p>

                {/* Error */}
                {modalError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm tracking-wide rounded">
                    <p className="font-semibold">❌ Error</p>
                    <p className="mt-1">{modalError}</p>
                  </div>
                )}

                {/* Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">
                    {actionType === 'delete'
                      ? 'Delete Confirmation'
                      : 'Remarks (Optional)'}
                  </label>

                  {actionType === 'delete' ? (
                    <p className="text-sm text-red-600 tracking-wide">
                      Are you sure you want to delete this query? This action cannot be undone.
                    </p>
                  ) : (
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide rounded"
                      rows={3}
                      placeholder={
                        actionType === 'resolve'
                          ? 'Add resolution remarks...'
                          : actionType === 'reject'
                          ? 'Provide rejection reason...'
                          : 'Add progress remarks...'
                      }
                    />
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  {actionType === 'inprogress' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedQuery, 'In Progress')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 rounded"
                    >
                      {updating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      In Progress
                    </button>
                  )}

                  {actionType === 'resolve' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedQuery, 'Resolved')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 rounded"
                    >
                      {updating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Resolve
                    </button>
                  )}

                  {actionType === 'reject' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedQuery, 'Rejected')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 rounded"
                    >
                      {updating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  )}

                  {actionType === 'delete' && (
                    <button
                      onClick={() => handleDeleteQuery(selectedQuery)}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 rounded"
                    >
                      {updating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowActionModal(false)
                      setSelectedQuery(null)
                      setAdminRemarks('')
                      setModalError('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </ProtectedRoute>
    </>
  )
}