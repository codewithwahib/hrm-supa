// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import NavbarDropdown from '@/components/navbar'
// import ProtectedRoute from '@/components/ProtectedRoute'
// import Footer from '@/components/footer'
// import { format } from 'date-fns'
// import { 
//   Search, 
//   Loader, 
//   RefreshCw, 
//   AlertCircle, 
//   Download,
//   Database,
//   X,
//   Layers
// } from 'lucide-react'
// import { Roboto } from 'next/font/google'

// const roboto = Roboto({
//   weight: ['300', '400', '500', '700'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// interface AttendanceLog {
//   id: number
//   user_id: string
//   employee_name: string | null
//   timestamp: string
//   punch_type: 'CHECK_IN' | 'CHECK_OUT'
//   device_id: string | null
//   branch_code: string | null
//   raw_log_key: string
// }

// export default function AttendanceLogsPage() {
//   const [logs, setLogs] = useState<AttendanceLog[]>([])
//   const [totalRecords, setTotalRecords] = useState<number>(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedDate, setSelectedDate] = useState('')
//   const [branchCode, setBranchCode] = useState('all')

//   const fetchAttendance = useCallback(async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const params = new URLSearchParams()
//       params.append('limit', '20')
//       if (selectedDate) params.append('date', selectedDate)
//       if (branchCode !== 'all') params.append('branch', branchCode)
//       if (searchTerm.trim()) params.append('search', searchTerm.trim())

//       const response = await fetch(`/api/attendance-logs?${params.toString()}`, {
//         method: 'GET',
//         cache: 'no-store'
//       })

//       if (!response.ok) {
//         const errorData = await response.json()
//         throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
//       }

//       const result = await response.json()
//       setLogs(result.data || [])
//       setTotalRecords(result.totalRecords || 0)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch logs')
//       setLogs([])
//       setTotalRecords(0)
//     } finally {
//       setLoading(false)
//     }
//   }, [selectedDate, branchCode, searchTerm])

//   useEffect(() => {
//     fetchAttendance()
//   }, [fetchAttendance])

//   const formatTimestamp = (ts: string) => {
//     try {
//       return format(new Date(ts), 'yyyy-MM-dd hh:mm:ss a')
//     } catch {
//       return ts
//     }
//   }

//   const exportToCSV = () => {
//     if (logs.length === 0) return

//     const headers = ['id', 'user_id', 'employee_name', 'timestamp', 'punch_type', 'device_id', 'branch_code', 'raw_log_key']
//     const csvRows = [
//       headers.join(','),
//       ...logs.map(log => [
//         log.id,
//         `"${log.user_id}"`,
//         `"${log.employee_name || ''}"`,
//         `"${log.timestamp}"`,
//         `"${log.punch_type}"`,
//         `"${log.device_id || ''}"`,
//         `"${log.branch_code || ''}"`,
//         `"${log.raw_log_key}"`
//       ].join(','))
//     ]

//     const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = `attendance_logs.csv`
//     a.click()
//     window.URL.revokeObjectURL(url)
//   }

//   return (
//     <ProtectedRoute allowedUser="hr">
//       <NavbarDropdown />
//       <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
//         <div className="max-w-7xl mx-auto">
          
//           {/* TOP SECTION: Page Header & Total Records Counter */}
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
//             <div>
//               <h1 className="text-2xl font-bold text-[#0071BD] flex items-center gap-2">
//                 <Database className="w-6 h-6" /> Attendance Logs
//               </h1>
//               <p className="text-xs text-gray-500 mt-1 font-mono">
//                 SELECT id, user_id, employee_name, timestamp, punch_type, device_id, branch_code, raw_log_key FROM public.attendance_logs ORDER BY timestamp DESC;
//               </p>
//             </div>

//             {/* Total Records Counter Display */}
//             <div className="flex items-center gap-3">
//               <div className="bg-white border border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm">
//                 <Layers className="w-5 h-5 text-[#0071BD]" />
//                 <div>
//                   <div className="text-[10px] uppercase font-bold text-gray-400 leading-none">Total Records</div>
//                   <div className="text-lg font-bold text-gray-800 leading-none mt-1">
//                     {loading ? '...' : totalRecords.toLocaleString()}
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={exportToCSV}
//                 disabled={logs.length === 0}
//                 className="px-4 py-2 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
//               >
//                 <Download className="w-4 h-4" /> Export CSV
//               </button>
//             </div>
//           </div>

//           {/* Filter Controls */}
//           <div className="bg-white p-3 shadow-sm border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
//             <div className="relative">
//               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search Name or User ID..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD]"
//               />
//               {searchTerm && (
//                 <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
//                   <X className="w-4 h-4" />
//                 </button>
//               )}
//             </div>

//             <div>
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD]"
//               />
//             </div>

//             <div>
//               <select
//                 value={branchCode}
//                 onChange={(e) => setBranchCode(e.target.value)}
//                 className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD]"
//               >
//                 <option value="all">All Branches</option>
//                 <option value="K">Korangi (K)</option>
//                 <option value="S">Saddar (S)</option>
//                 <option value="G">Gulshan (G)</option>
//               </select>
//             </div>

//             <button
//               onClick={fetchAttendance}
//               className="px-4 py-1.5 bg-[#0071BD] text-white text-sm font-medium hover:bg-[#005a96] transition flex items-center justify-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" /> Run Query
//             </button>
//           </div>

//           {/* Table Display */}
//           {loading ? (
//             <div className="bg-white p-12 text-center border border-gray-200 shadow-sm">
//               <Loader className="w-8 h-8 animate-spin text-[#0071BD] mx-auto mb-3" />
//               <p className="text-gray-500 text-sm">Counting & Fetching Records...</p>
//             </div>
//           ) : error ? (
//             <div className="bg-white p-8 text-center border border-red-200 shadow-sm">
//               <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
//               <h3 className="text-lg font-semibold text-gray-800 mb-1">Query Error</h3>
//               <p className="text-sm text-red-600 font-mono mb-4">{error}</p>
//               <button onClick={fetchAttendance} className="px-4 py-1.5 bg-[#0071BD] text-white text-xs">
//                 Retry Query
//               </button>
//             </div>
//           ) : (
//             <div className="bg-white shadow-sm border border-gray-200 overflow-x-auto">
//               <table className="w-full text-left border-collapse text-sm">
//                 <thead>
//                   <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-xs font-semibold uppercase tracking-wider">
//                     <th className="p-3 border-r border-gray-200">ID</th>
//                     <th className="p-3 border-r border-gray-200">User ID</th>
//                     <th className="p-3 border-r border-gray-200">Employee Name</th>
//                     <th className="p-3 border-r border-gray-200">Timestamp</th>
//                     <th className="p-3 border-r border-gray-200">Punch Type</th>
//                     <th className="p-3 border-r border-gray-200">Device ID</th>
//                     <th className="p-3 border-r border-gray-200">Branch Code</th>
//                     <th className="p-3">Raw Log Key</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {logs.length === 0 ? (
//                     <tr>
//                       <td colSpan={8} className="p-8 text-center text-gray-500 text-sm">
//                         No records found in database.
//                       </td>
//                     </tr>
//                   ) : (
//                     logs.map((row) => (
//                       <tr key={row.id} className="hover:bg-blue-50/50 transition">
//                         <td className="p-3 border-r border-gray-200 font-mono text-xs font-semibold text-gray-600">
//                           {row.id}
//                         </td>
//                         <td className="p-3 border-r border-gray-200 font-medium text-gray-800">
//                           {row.user_id}
//                         </td>
//                         <td className="p-3 border-r border-gray-200 text-gray-800">
//                           {row.employee_name || <span className="text-gray-400 italic">N/A</span>}
//                         </td>
//                         <td className="p-3 border-r border-gray-200 font-mono text-xs text-gray-700 whitespace-nowrap">
//                           {formatTimestamp(row.timestamp)}
//                         </td>
//                         <td className="p-3 border-r border-gray-200">
//                           <span
//                             className={`px-2 py-0.5 text-xs font-bold rounded-sm tracking-wide ${
//                               row.punch_type === 'CHECK_IN'
//                                 ? 'bg-green-100 text-green-800'
//                                 : 'bg-blue-100 text-blue-800'
//                             }`}
//                           >
//                             {row.punch_type}
//                           </span>
//                         </td>
//                         <td className="p-3 border-r border-gray-200 text-xs font-mono text-gray-600">
//                           {row.device_id || 'N/A'}
//                         </td>
//                         <td className="p-3 border-r border-gray-200 text-xs font-semibold text-gray-700 text-center">
//                           {row.branch_code || 'N/A'}
//                         </td>
//                         <td className="p-3 font-mono text-xs text-gray-500 max-w-[180px] truncate">
//                           {row.raw_log_key}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//               <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center font-medium">
//                 <span>Showing {logs.length} displayed records</span>
//                 <span>Total Database Records: <strong>{totalRecords.toLocaleString()}</strong></span>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//       <Footer />
//     </ProtectedRoute>
//   )
// }


'use client'

import { useState, useEffect, useCallback } from 'react'
import NavbarDropdown from '@/components/navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Footer from '@/components/footer'
import { format } from 'date-fns'
import { 
  Search, 
  Loader, 
  RefreshCw, 
  AlertCircle, 
  Download,
  Database,
  X,
  Layers
} from 'lucide-react'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

interface AttendanceLog {
  id: number
  user_id: string
  employee_name: string | null
  timestamp: string
  punch_type: 'CHECK_IN' | 'CHECK_OUT'
  device_id: string | null
  branch_code: string | null
  raw_log_key: string
}

export default function AttendanceLogsPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [branchCode, setBranchCode] = useState('all')
  const [availableBranches, setAvailableBranches] = useState<string[]>([])

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('limit', '20')
      if (selectedDate) params.append('date', selectedDate)
      if (branchCode !== 'all') params.append('branch', branchCode)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())

      const response = await fetch(`/api/attendance-logs?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setLogs(result.data || [])
      setTotalRecords(result.totalRecords || 0)
      
      // Extract unique branch codes from the fetched data
      if (result.data && result.data.length > 0) {
        const branches = [...new Set(result.data.map((log: AttendanceLog) => log.branch_code).filter(Boolean))] as string[]
        setAvailableBranches(branches)
      } else {
        setAvailableBranches([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
      setLogs([])
      setTotalRecords(0)
      setAvailableBranches([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate, branchCode, searchTerm])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const formatTimestamp = (ts: string) => {
    try {
      return format(new Date(ts), 'yyyy-MM-dd hh:mm:ss a')
    } catch {
      return ts
    }
  }

  const exportToCSV = () => {
    if (logs.length === 0) return

    const headers = ['id', 'user_id', 'employee_name', 'timestamp', 'punch_type', 'device_id', 'branch_code', 'raw_log_key']
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        `"${log.user_id}"`,
        `"${log.employee_name || ''}"`,
        `"${log.timestamp}"`,
        `"${log.punch_type}"`,
        `"${log.device_id || ''}"`,
        `"${log.branch_code || ''}"`,
        `"${log.raw_log_key}"`
      ].join(','))
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_logs.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get branch display name
  const getBranchDisplayName = (code: string) => {
    const branchMap: { [key: string]: string } = {
      'K': 'Korangi (K)',
      'S': 'Saddar (S)',
      'G': 'Gulshan (G)'
    }
    return branchMap[code] || code
  }

  return (
    <ProtectedRoute allowedUser="hr">
      <NavbarDropdown />
      <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
        <div className="max-w-7xl mx-auto">
          
          {/* TOP SECTION: Page Header & Total Records Counter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0071BD] flex items-center gap-2 tracking-wide">
                <Database className="w-6 h-6" /> Attendance Logs
              </h1>
              
            </div>

            {/* Total Records Counter Display */}
            <div className="flex items-center gap-3">
              

              <button
                onClick={exportToCSV}
                disabled={logs.length === 0}
                className="px-4 py-2 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 tracking-wide"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white p-3 shadow-sm border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Name or User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-black text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD] tracking-wide"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm text-black border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD] tracking-wide"
              />
            </div>

            <div>
              <select
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border text-black border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0071BD] tracking-wide"
              >
                <option value="all">All Branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {getBranchDisplayName(branch)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAttendance}
              className="px-4 py-1.5 bg-[#0071BD] text-white text-sm font-medium hover:bg-[#005a96] transition flex items-center justify-center gap-2 tracking-wide"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Table Display */}
          {loading ? (
            <div className="bg-white p-12 text-center border border-gray-200 shadow-sm">
              <Loader className="w-8 h-8 animate-spin text-[#0071BD] mx-auto mb-3" />
            </div>
          ) : error ? (
            <div className="bg-white p-8 text-center border border-red-200 shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1 tracking-wide">Query Error</h3>
              <p className="text-sm text-red-600 font-mono mb-4 tracking-wide">{error}</p>
              <button onClick={fetchAttendance} className="px-4 py-1.5 bg-[#0071BD] text-white text-xs tracking-wide">
                Retry Query
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3 border-r border-gray-200 tracking-wide">S.No</th>
                    <th className="p-3 border-r border-gray-200 tracking-wide">User ID</th>
                    <th className="p-3 border-r border-gray-200 tracking-wide">Employee Name</th>
                    <th className="p-3 border-r border-gray-200 tracking-wide">Timestamp</th>
                    <th className="p-3 border-r border-gray-200 tracking-wide">Punch Type</th>
                    <th className="p-3 border-r border-gray-200 tracking-wide">Device ID</th>
                    <th className="p-3 tracking-wide">Branch Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 text-sm tracking-wide">
                        No records found in database.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row, index) => (
                      <tr key={row.id} className="hover:bg-blue-50/50 transition">
                        <td className="p-3 border-r border-gray-200 font-mono text-xs font-semibold text-gray-600 tracking-wide">
                          {index + 1}
                        </td>
                        <td className="p-3 border-r border-gray-200 font-medium text-gray-800 tracking-wide">
                          {row.user_id}
                        </td>
                        <td className="p-3 border-r border-gray-200 text-gray-800 tracking-wide">
                          {row.employee_name || <span className="text-gray-400 italic">N/A</span>}
                        </td>
                        <td className="p-3 border-r border-gray-200 font-mono text-xs text-gray-700 whitespace-nowrap tracking-wide">
                          {formatTimestamp(row.timestamp)}
                        </td>
                        <td className="p-3 border-r border-gray-200 tracking-wide">
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded-sm tracking-wider ${
                              row.punch_type === 'CHECK_IN'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {row.punch_type}
                          </span>
                        </td>
                        <td className="p-3 border-r border-gray-200 text-xs font-mono text-gray-600 tracking-wide">
                          {row.device_id || 'N/A'}
                        </td>
                        <td className="p-3 text-xs font-semibold text-gray-700 text-center tracking-wide">
                          {row.branch_code || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center font-medium">
                <span className="tracking-wide">Showing {logs.length} displayed records</span>
                <span className="tracking-wide">Total Database Records: <strong>{totalRecords.toLocaleString()}</strong></span>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  )
}