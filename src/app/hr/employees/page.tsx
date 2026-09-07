// // app/hr/employees/page.tsx
// 'use client'

// import { useState, useEffect, useCallback, useRef } from 'react'
// import NavbarDropdown from '@/components/navbar'
// import Footer from '@/components/footer'
// import { useRouter } from 'next/navigation'
// import ProtectedRoute from '@/components/ProtectedRoute'
// import { createClient } from '@supabase/supabase-js'
// import {
//   Search,
//   User,
//   Phone,
//   Building,
//   Briefcase,
//   Calendar,
//   MapPin,
//   Eye,
//   Edit,
//   Trash2,
//   RefreshCw,
//   AlertCircle,
//   Loader,
//   ChevronLeft,
//   ChevronRight,
//   Users,
//   IdCard,
//   FileText,
//   Heart,
//   GraduationCap,
//   Clock,
//   UserPlus,
//   Filter,
//   X,
//   Save,
//   UserCheck,
//   UserX,
//   File,
//   Download,
//   ExternalLink
// } from 'lucide-react'

// // Import Roboto font
// import { Roboto } from 'next/font/google'

// const roboto = Roboto({
//   weight: ['100', '300', '400', '500', '700', '900'],
//   style: ['normal', 'italic'],
//   subsets: ['latin'],
//   display: 'swap',
// })

// interface Employee {
//   id: string
//   employee_id: string
//   full_name: string
//   father_name: string
//   cnic_number: string
//   phone_number: string
//   emergency_contact: string
//   date_of_birth: string
//   marital_status: string
//   residential_address: string
//   joining_date: string
//   department: string
//   position: string
//   username: string
//   password: string
//   qualifications: Array<{
//     degree: string
//     institution: string
//     year: string
//     grade: string
//   }>
//   experience: Array<{
//     company: string
//     position: string
//     fromDate: string
//     toDate: string
//     description: string
//   }>
//   cv_url: string
//   created_at: string
//   updated_at: string
// }

// export default function EmployeesPage() {
//   const router = useRouter()
//   const [employees, setEmployees] = useState<Employee[]>([])
//   const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedDepartment, setSelectedDepartment] = useState('all')
//   const [currentPage, setCurrentPage] = useState(1)
//   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
//   const [showDetailsModal, setShowDetailsModal] = useState(false)
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
//   const [editLoading, setEditLoading] = useState(false)
//   const [deleteLoading, setDeleteLoading] = useState(false)
//   const [deleteId, setDeleteId] = useState<string | null>(null)
//   const itemsPerPage = 10

//   // Initialize Supabase client
//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )

//   // Use ref to prevent multiple fetches
//   const fetchedRef = useRef(false)

//   // Fetch employees function - stable with useCallback
//   const fetchEmployees = useCallback(async () => {
//     try {
//       setLoading(true)
//       setError('')
      
//       const { data, error: fetchError } = await supabase
//         .from('employees')
//         .select('*')
//         .order('created_at', { ascending: false })

//       if (fetchError) {
//         throw new Error(fetchError.message)
//       }

//       console.log('Fetched employees:', data?.length || 0, 'records')
      
//       setEmployees(data || [])
//       setFilteredEmployees(data || [])
//     } catch (err) {
//       console.error('Error fetching employees:', err)
//       setError('Failed to load employees. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }, [supabase])

//   // Initial fetch - only once
//   useEffect(() => {
//     if (!fetchedRef.current) {
//       fetchedRef.current = true
//       fetchEmployees()
//     }
//   }, [fetchEmployees])

//   // Get unique departments for filter
//   const departments = ['all', ...new Set(employees.map(emp => emp.department).filter(Boolean))]

//   // Filter and search - stable
//   useEffect(() => {
//     let filtered = employees
    
//     if (searchTerm) {
//       const term = searchTerm.toLowerCase()
//       filtered = filtered.filter(emp => 
//         emp.full_name?.toLowerCase().includes(term) ||
//         emp.employee_id?.toLowerCase().includes(term) ||
//         emp.department?.toLowerCase().includes(term) ||
//         emp.position?.toLowerCase().includes(term) ||
//         emp.phone_number?.includes(term) ||
//         emp.cnic_number?.includes(term)
//       )
//     }
    
//     if (selectedDepartment !== 'all') {
//       filtered = filtered.filter(emp => 
//         emp.department === selectedDepartment
//       )
//     }
    
//     setFilteredEmployees(filtered)
//     setCurrentPage(1)
//   }, [searchTerm, selectedDepartment, employees])

//   // Pagination
//   const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

//   const formatDate = (dateString: string) => {
//     if (!dateString) return 'N/A'
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       })
//     } catch {
//       return 'Invalid Date'
//     }
//   }

//   const formatDateTime = (dateString: string) => {
//     if (!dateString) return 'N/A'
//     try {
//       return new Date(dateString).toLocaleString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       })
//     } catch {
//       return 'Invalid Date'
//     }
//   }

//   const handleViewDetails = (employee: Employee) => {
//     setSelectedEmployee(employee)
//     setShowDetailsModal(true)
//   }

//   const handleEditClick = (employee: Employee) => {
//     setEditingEmployee(employee)
//     setShowEditModal(true)
//   }

//   const handleEditChange = (field: string, value: string) => {
//     if (!editingEmployee) return
//     setEditingEmployee({
//       ...editingEmployee,
//       [field]: value
//     })
//   }

//   const handleEditSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!editingEmployee) return

//     try {
//       setEditLoading(true)
//       setError('')
//       setSuccess('')

//       const { error: updateError } = await supabase
//         .from('employees')
//         .update({
//           employee_id: editingEmployee.employee_id,
//           full_name: editingEmployee.full_name,
//           father_name: editingEmployee.father_name,
//           cnic_number: editingEmployee.cnic_number,
//           phone_number: editingEmployee.phone_number,
//           emergency_contact: editingEmployee.emergency_contact,
//           date_of_birth: editingEmployee.date_of_birth,
//           marital_status: editingEmployee.marital_status,
//           residential_address: editingEmployee.residential_address,
//           joining_date: editingEmployee.joining_date,
//           department: editingEmployee.department,
//           position: editingEmployee.position,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', editingEmployee.id)

//       if (updateError) {
//         throw new Error(updateError.message)
//       }

//       setSuccess('Employee updated successfully!')
//       await fetchEmployees()
//       setShowEditModal(false)
      
//       setTimeout(() => setSuccess(''), 3000)
//     } catch (err) {
//       console.error('Error updating employee:', err)
//       setError(err instanceof Error ? err.message : 'Failed to update employee')
//       setTimeout(() => setError(''), 3000)
//     } finally {
//       setEditLoading(false)
//     }
//   }

//   const handleDeleteEmployee = async (employeeId: string) => {
//     if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
//       return
//     }

//     try {
//       setDeleteId(employeeId)
//       setDeleteLoading(true)
//       setError('')
//       setSuccess('')

//       const { error: deleteError } = await supabase
//         .from('employees')
//         .delete()
//         .eq('id', employeeId)

//       if (deleteError) {
//         throw new Error(deleteError.message)
//       }

//       setSuccess('Employee deleted successfully!')
//       await fetchEmployees()
      
//       setTimeout(() => setSuccess(''), 3000)
//     } catch (err) {
//       console.error('Error deleting employee:', err)
//       setError(err instanceof Error ? err.message : 'Failed to delete employee')
//       setTimeout(() => setError(''), 3000)
//     } finally {
//       setDeleteLoading(false)
//       setDeleteId(null)
//     }
//   }

//   const handleViewCV = (employee: Employee) => {
//     if (employee.cv_url) {
//       window.open(employee.cv_url, '_blank')
//     } else {
//       alert('No CV uploaded for this employee')
//     }
//   }

//   const handleDownloadCV = (employee: Employee) => {
//     if (employee.cv_url) {
//       const link = document.createElement('a')
//       link.href = employee.cv_url
//       link.download = `${employee.full_name || 'employee'}_CV.pdf`
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)
//     } else {
//       alert('No CV uploaded for this employee')
//     }
//   }

//   // Show loading only on first load
//   if (loading && employees.length === 0) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center">
//           <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
//         </div>
//       </div>
//     )
//   }

//   return (
//     <>
//     <ProtectedRoute allowedUser='hr'>
//       <NavbarDropdown />
//       <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
//         <div className="max-w-7xl mx-auto">
//           {/* Header */}
//           <div className="mb-6">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <div className="flex items-center gap-3">
//                 <div>
//                   <h1 className={`text-3xl font-bold text-[#0071BD] ${roboto.className} tracking-wider`}>
//                     Employee Management
//                   </h1>
//                   <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide mt-1`}>
//                     Manage all employees and their details
//                   </p>
//                 </div>
//               </div>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setLoading(true)
//                     fetchEmployees()
//                   }}
//                   className={`px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 ${roboto.className} tracking-wider`}
//                 >
//                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//                   Refresh
//                 </button>
//                 <button
//                   onClick={() => router.push('/hr/add-employee')}
//                   className={`px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 ${roboto.className} tracking-wider`}
//                 >
//                   <UserPlus className="w-4 h-4" />
//                   Add Employee
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Success/Error Messages */}
//           {success && (
//             <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded">
//               <UserCheck className="w-5 h-5 text-green-500 mt-0.5" />
//               <div className="flex-1">
//                 <p className={`text-sm text-green-700 ${roboto.className} tracking-wide`}>{success}</p>
//               </div>
//               <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-gray-600">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           )}

//           {error && (
//             <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded">
//               <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
//               <div className="flex-1">
//                 <p className={`text-sm text-red-700 ${roboto.className} tracking-wide`}>{error}</p>
//               </div>
//               <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           )}

//           {/* Filters */}
//           <div className="bg-white shadow-sm p-4 mb-6">
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1 relative">
//                 <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search by name, ID, department, position, phone, or CNIC..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className={`w-full pl-10 text-black pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                 />
//               </div>
//               <div className="flex text-black items-center gap-2">
//                 <Filter className="w-4 h-4 text-gray-400" />
//                 <select
//                   value={selectedDepartment}
//                   onChange={(e) => setSelectedDepartment(e.target.value)}
//                   className={`px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm min-w-[150px] ${roboto.className} tracking-wide`}
//                 >
//                   <option value="all">All Departments</option>
//                   {departments.filter(d => d !== 'all').map((dept) => (
//                     <option key={dept} value={dept}>{dept}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//             <div className="bg-white shadow-sm p-4">
//               <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Total Employees</div>
//               <div className={`text-2xl font-bold text-[#0071BD] ${roboto.className} tracking-wider`}>{employees.length}</div>
//             </div>
//             <div className="bg-white shadow-sm p-4">
//               <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Departments</div>
//               <div className={`text-2xl font-bold text-blue-600 ${roboto.className} tracking-wider`}>
//                 {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
//               </div>
//             </div>
//             <div className="bg-white shadow-sm p-4">
//               <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>With CV</div>
//               <div className={`text-2xl font-bold text-green-600 ${roboto.className} tracking-wider`}>
//                 {employees.filter(emp => emp.cv_url).length}
//               </div>
//             </div>
//             <div className="bg-white shadow-sm p-4">
//               <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Without CV</div>
//               <div className={`text-2xl font-bold text-red-600 ${roboto.className} tracking-wider`}>
//                 {employees.filter(emp => !emp.cv_url).length}
//               </div>
//             </div>
//           </div>

//           {/* Employees Table */}
//           {filteredEmployees.length === 0 ? (
//             <div className="bg-white shadow-sm p-8 text-center">
//               <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//               <p className={`text-gray-500 ${roboto.className} tracking-wide`}>
//                 {searchTerm || selectedDepartment !== 'all' ? 'No employees match your filters' : 'No employees found'}
//               </p>
//               {(searchTerm || selectedDepartment !== 'all') && (
//                 <button
//                   onClick={() => {
//                     setSearchTerm('')
//                     setSelectedDepartment('all')
//                   }}
//                   className={`mt-2 text-sm text-[#0071BD] hover:underline ${roboto.className} tracking-wide`}
//                 >
//                   Clear filters
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="bg-white shadow-sm overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="bg-gray-50 border-b border-gray-200">
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Employee</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>ID</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Department</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Position</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Contact</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>CV</th>
//                       <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {currentEmployees.map((employee) => (
//                       <tr key={employee.id} className="hover:bg-gray-50 transition">
//                         <td className="px-4 py-3">
//                           <div className="flex items-center gap-3">
//                             <div className="w-10 h-10 rounded-full bg-[#0071BD]/10 flex items-center justify-center">
//                               <User className="w-5 h-5 text-[#0071BD]" />
//                             </div>
//                             <div>
//                               <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>
//                                 {employee.full_name || 'N/A'}
//                               </p>
//                               <p className={`text-xs text-gray-400 ${roboto.className} tracking-wide`}>
//                                 Joined: {formatDate(employee.joining_date)}
//                               </p>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>
//                             {employee.employee_id || 'N/A'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className={`px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded ${roboto.className} tracking-wide`}>
//                             {employee.department || 'N/A'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>
//                             {employee.position || 'N/A'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="flex flex-col gap-0.5">
//                             <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide flex items-center gap-1`}>
//                               <Phone className="w-3 h-3" />
//                               {employee.phone_number || 'N/A'}
//                             </span>
//                             <span className={`text-xs text-gray-400 ${roboto.className} tracking-wide flex items-center gap-1`}>
//                               <FileText className="w-3 h-3" />
//                               {employee.cnic_number || 'N/A'}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-4 py-3">
//                           {employee.cv_url ? (
//                             <div className="flex items-center gap-2">
//                               <button
//                                 onClick={() => handleViewCV(employee)}
//                                 className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
//                                 title="View CV"
//                               >
//                                 <Eye className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => handleDownloadCV(employee)}
//                                 className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
//                                 title="Download CV"
//                               >
//                                 <Download className="w-4 h-4" />
//                               </button>
//                             </div>
//                           ) : (
//                             <span className={`text-xs text-gray-400 ${roboto.className} tracking-wide`}>No CV</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="flex items-center gap-2">
//                             <button
//                               onClick={() => handleViewDetails(employee)}
//                               className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
//                               title="View Details"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => handleEditClick(employee)}
//                               className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
//                               title="Edit"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => handleDeleteEmployee(employee.id)}
//                               disabled={deleteLoading && deleteId === employee.id}
//                               className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
//                               title="Delete"
//                             >
//                               {deleteLoading && deleteId === employee.id ? (
//                                 <Loader className="w-4 h-4 animate-spin" />
//                               ) : (
//                                 <Trash2 className="w-4 h-4" />
//                               )}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Pagination */}
//               {totalPages > 1 && (
//                 <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
//                   <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
//                     Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                       disabled={currentPage === 1}
//                       className="p-2 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <ChevronLeft className="w-4 h-4" />
//                     </button>
//                     <span className={`px-4 py-2 text-sm text-gray-700 ${roboto.className} tracking-wide`}>
//                       Page {currentPage} of {totalPages}
//                     </span>
//                     <button
//                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                       disabled={currentPage === totalPages}
//                       className="p-2 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <ChevronRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* View Details Modal */}
//       {showDetailsModal && selectedEmployee && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
//             <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
//               <h2 className={`text-xl font-bold text-gray-800 ${roboto.className} tracking-wider`}>
//                 Employee Details
//               </h2>
//               <button
//                 onClick={() => setShowDetailsModal(false)}
//                 className="p-2 hover:bg-gray-100 rounded transition"
//               >
//                 <X className="w-6 h-6 text-gray-500" />
//               </button>
//             </div>

//             <div className="p-6 space-y-6">
//               {/* Personal Details */}
//               <div>
//                 <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
//                   <User className="w-5 h-5 text-[#0071BD]" />
//                   Personal Details
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Employee ID</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.employee_id || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Full Name</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.full_name || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Father Name</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.father_name || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>CNIC Number</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.cnic_number || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Phone Number</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.phone_number || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Emergency Contact</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.emergency_contact || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Date of Birth</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDate(selectedEmployee.date_of_birth)}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Marital Status</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.marital_status || 'N/A'}</p>
//                   </div>
//                   <div className="md:col-span-2">
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Residential Address</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.residential_address || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Joining Date</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDate(selectedEmployee.joining_date)}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Department</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.department || 'N/A'}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Position</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.position || 'N/A'}</p>
//                   </div>
//                   {/* CV Section in Details Modal */}
//                   <div className="md:col-span-2">
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>CV / Resume</p>
//                     {selectedEmployee.cv_url ? (
//                       <div className="flex items-center gap-3 mt-1">
//                         <button
//                           onClick={() => handleViewCV(selectedEmployee)}
//                           className={`px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 text-sm rounded ${roboto.className} tracking-wide`}
//                         >
//                           <Eye className="w-4 h-4" />
//                           View CV
//                         </button>
//                         <button
//                           onClick={() => handleDownloadCV(selectedEmployee)}
//                           className={`px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2 text-sm rounded ${roboto.className} tracking-wide`}
//                         >
//                           <Download className="w-4 h-4" />
//                           Download CV
//                         </button>
//                       </div>
//                     ) : (
//                       <p className={`text-sm text-gray-400 mt-1 ${roboto.className} tracking-wide`}>No CV uploaded</p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Qualifications */}
//               {selectedEmployee.qualifications && selectedEmployee.qualifications.length > 0 && (
//                 <div>
//                   <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
//                     <GraduationCap className="w-5 h-5 text-[#0071BD]" />
//                     Qualifications
//                   </h3>
//                   <div className="space-y-3">
//                     {selectedEmployee.qualifications.map((qual, index) => (
//                       <div key={index} className="bg-gray-50 p-4 rounded">
//                         <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{qual.degree}</p>
//                         <p className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>{qual.institution}</p>
//                         <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
//                           {qual.year} {qual.grade ? `• ${qual.grade}` : ''}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Experience */}
//               {selectedEmployee.experience && selectedEmployee.experience.length > 0 && (
//                 <div>
//                   <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
//                     <Briefcase className="w-5 h-5 text-[#0071BD]" />
//                     Experience
//                   </h3>
//                   <div className="space-y-3">
//                     {selectedEmployee.experience.map((exp, index) => (
//                       <div key={index} className="bg-gray-50 p-4 rounded">
//                         <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{exp.position}</p>
//                         <p className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>{exp.company}</p>
//                         <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
//                           {exp.fromDate && exp.toDate 
//                             ? `${formatDate(exp.fromDate)} - ${formatDate(exp.toDate)}`
//                             : 'Date not specified'}
//                         </p>
//                         {exp.description && (
//                           <p className={`text-sm text-gray-600 mt-1 ${roboto.className} tracking-wide`}>{exp.description}</p>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* System Info */}
//               <div>
//                 <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
//                   <Clock className="w-5 h-5 text-[#0071BD]" />
//                   System Information
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Created At</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDateTime(selectedEmployee.created_at)}</p>
//                   </div>
//                   <div>
//                     <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Last Updated</p>
//                     <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDateTime(selectedEmployee.updated_at)}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Employee Modal */}
//       {showEditModal && editingEmployee && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
//             <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
//               <h2 className={`text-xl font-bold text-gray-800 ${roboto.className} tracking-wider`}>
//                 Edit Employee
//               </h2>
//               <button
//                 onClick={() => setShowEditModal(false)}
//                 className="p-2 hover:bg-gray-100 rounded transition"
//               >
//                 <X className="w-6 h-6 text-gray-500" />
//               </button>
//             </div>

//             <form onSubmit={handleEditSubmit}>
//               <div className="p-6 space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Employee ID
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.employee_id || ''}
//                       onChange={(e) => handleEditChange('employee_id', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Full Name
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.full_name || ''}
//                       onChange={(e) => handleEditChange('full_name', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Father Name
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.father_name || ''}
//                       onChange={(e) => handleEditChange('father_name', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       CNIC Number
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.cnic_number || ''}
//                       onChange={(e) => handleEditChange('cnic_number', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Phone Number
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.phone_number || ''}
//                       onChange={(e) => handleEditChange('phone_number', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Emergency Contact
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.emergency_contact || ''}
//                       onChange={(e) => handleEditChange('emergency_contact', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Date of Birth
//                     </label>
//                     <input
//                       type="date"
//                       value={editingEmployee.date_of_birth || ''}
//                       onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Marital Status
//                     </label>
//                     <select
//                       value={editingEmployee.marital_status || ''}
//                       onChange={(e) => handleEditChange('marital_status', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     >
//                       <option value="">Select</option>
//                       <option value="Single">Single</option>
//                       <option value="Married">Married</option>
//                       <option value="Divorced">Divorced</option>
//                       <option value="Widowed">Widowed</option>
//                     </select>
//                   </div>
//                   <div className="md:col-span-2">
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Residential Address
//                     </label>
//                     <textarea
//                       value={editingEmployee.residential_address || ''}
//                       onChange={(e) => handleEditChange('residential_address', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                       rows={2}
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Joining Date
//                     </label>
//                     <input
//                       type="date"
//                       value={editingEmployee.joining_date || ''}
//                       onChange={(e) => handleEditChange('joining_date', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     />
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Department
//                     </label>
//                     <select
//                       value={editingEmployee.department || ''}
//                       onChange={(e) => handleEditChange('department', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     >
//                       <option value="">Select</option>
//                       <option value="HR">HR</option>
//                       <option value="IT">IT</option>
//                       <option value="Finance">Finance</option>
//                       <option value="Marketing">Marketing</option>
//                       <option value="Sales">Sales</option>
//                       <option value="Operations">Operations</option>
//                       <option value="Engineering">Engineering</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
//                       Position
//                     </label>
//                     <input
//                       type="text"
//                       value={editingEmployee.position || ''}
//                       onChange={(e) => handleEditChange('position', e.target.value)}
//                       className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setShowEditModal(false)}
//                   className={`px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition ${roboto.className} tracking-wider`}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={editLoading}
//                   className={`px-6 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 ${roboto.className} tracking-wider disabled:opacity-50`}
//                 >
//                   {editLoading ? (
//                     <Loader className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Save className="w-4 h-4" />
//                   )}
//                   {editLoading ? 'Saving...' : 'Save Changes'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <Footer />
//       </ProtectedRoute>
//     </>
//   )
// }

// app/hr/employees/page.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import NavbarDropdown from '@/components/navbar'
import Footer from '@/components/footer'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createClient } from '@supabase/supabase-js'
import {
  Search,
  User,
  Phone,
  Building,
  Briefcase,
  GraduationCap,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Users,
  IdCard,
  FileText,
  Heart,
  GraduationCap as GraduationIcon,
  Clock,
  UserPlus,
  Filter,
  X,
  Save,
  UserCheck,
  UserX,
  File,
  Download,
  ExternalLink,
  Mail,
  Globe,
  Award,
  BookOpen,
  Upload,
  CheckCircle
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
  father_name: string
  cnic_number: string
  phone_number: string
  emergency_contact: string
  date_of_birth: string
  marital_status: string
  residential_address: string
  joining_date: string
  department: string
  position: string
  source: string
  username: string
  password: string
  qualifications: Array<{
    degree: string
    institution: string
    year: string
    grade: string
  }>
  experience: Array<{
    company: string
    position: string
    fromDate: string
    toDate: string
    description: string
  }>
  cv_url: string
  created_at: string
  updated_at: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // CV Upload states for Edit Modal
  const [editCvFile, setEditCvFile] = useState<File | null>(null)
  const [editCvFileName, setEditCvFileName] = useState('')
  const [editCvUploading, setEditCvUploading] = useState(false)
  const [editCvUploaded, setEditCvUploaded] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  
  const itemsPerPage = 10

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Use ref to prevent multiple fetches
  const fetchedRef = useRef(false)

  // Helper function to get full CV URL
  const getFullCVUrl = (cvUrl: string): string | null => {
    if (!cvUrl) return null
    
    if (cvUrl.startsWith('http://') || cvUrl.startsWith('https://')) {
      return cvUrl
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const bucketName = 'CVS'
    
    if (!supabaseUrl) {
      console.error('❌ Supabase URL not configured')
      return null
    }
    
    const cleanPath = cvUrl.replace(/^\/+/, '')
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`
  }

  // View CV in new tab
  const handleViewCV = (employee: Employee) => {
    if (!employee.cv_url) {
      alert('No CV uploaded for this employee')
      return
    }
    
    const publicUrl = getFullCVUrl(employee.cv_url)
    
    if (!publicUrl) {
      alert('Invalid CV URL')
      return
    }
    
    console.log('📄 Opening CV:', publicUrl)
    window.open(publicUrl, '_blank', 'noopener,noreferrer')
  }

  // Download CV
  const handleDownloadCV = (employee: Employee) => {
    if (!employee.cv_url) {
      alert('No CV uploaded for this employee')
      return
    }
    
    const publicUrl = getFullCVUrl(employee.cv_url)
    
    if (!publicUrl) {
      alert('Invalid CV URL')
      return
    }
    
    console.log('⬇️ Downloading CV:', publicUrl)
    const link = document.createElement('a')
    link.href = publicUrl
    link.target = '_blank'
    const fileName = employee.full_name 
      ? `${employee.full_name.replace(/\s+/g, '_')}_CV.pdf`
      : `employee_${employee.employee_id || 'unknown'}_CV.pdf`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Upload CV for Edit Modal
  const uploadEditCV = async (file: File): Promise<string> => {
    try {
      setEditCvUploading(true)
      setEditCvUploaded(false)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      console.log('📤 Uploading CV for edit...')
      
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
      
      setEditCvUploaded(true)
      return result.url
    } catch (error) {
      console.error('❌ Error uploading CV:', error)
      setEditCvUploaded(false)
      throw error
    } finally {
      setEditCvUploading(false)
    }
  }

  // Handle CV upload in edit modal
  const handleEditCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setEditCvFile(file)
      setEditCvFileName(file.name)
      setEditCvUploaded(false)
    }
  }

  const removeEditCV = () => {
    setEditCvFile(null)
    setEditCvFileName('')
    setEditCvUploaded(false)
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''
    }
  }

  // Fetch employees function
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      console.log('Fetched employees:', data?.length || 0, 'records')
      
      setEmployees(data || [])
      setFilteredEmployees(data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
      setError('Failed to load employees. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchEmployees()
    }
  }, [fetchEmployees])

  // Get unique departments for filter
  const departments = ['all', ...new Set(employees.map(emp => emp.department).filter(Boolean))]

  // Filter and search
  useEffect(() => {
    let filtered = employees
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emp => 
        emp.full_name?.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.phone_number?.includes(term) ||
        emp.cnic_number?.includes(term)
      )
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => 
        emp.department === selectedDepartment
      )
    }
    
    setFilteredEmployees(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedDepartment, employees])

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatDateTime = (dateString: string) => {
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
      return 'Invalid Date'
    }
  }

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDetailsModal(true)
  }

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee({ ...employee })
    setEditCvFile(null)
    setEditCvFileName('')
    setEditCvUploaded(false)
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''
    }
    setShowEditModal(true)
  }

  const handleEditChange = (field: string, value: string) => {
    if (!editingEmployee) return
    setEditingEmployee({
      ...editingEmployee,
      [field]: value
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      setEditLoading(true)
      setError('')
      setSuccess('')

      let cvUrl = editingEmployee.cv_url

      // If a new CV was uploaded, use the new URL
      if (editCvFile) {
        try {
          const uploadedUrl = await uploadEditCV(editCvFile)
          cvUrl = uploadedUrl
          console.log('✅ New CV uploaded:', cvUrl)
        } catch (uploadError) {
          setError(`CV Upload Failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
          setEditLoading(false)
          return
        }
      }

      const { error: updateError } = await supabase
        .from('employees')
        .update({
          employee_id: editingEmployee.employee_id,
          full_name: editingEmployee.full_name,
          father_name: editingEmployee.father_name,
          cnic_number: editingEmployee.cnic_number,
          phone_number: editingEmployee.phone_number,
          emergency_contact: editingEmployee.emergency_contact,
          date_of_birth: editingEmployee.date_of_birth,
          marital_status: editingEmployee.marital_status,
          residential_address: editingEmployee.residential_address,
          joining_date: editingEmployee.joining_date,
          department: editingEmployee.department,
          position: editingEmployee.position,
          cv_url: cvUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEmployee.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess('Employee updated successfully!')
      await fetchEmployees()
      setShowEditModal(false)
      
      // Reset CV states
      setEditCvFile(null)
      setEditCvFileName('')
      setEditCvUploaded(false)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating employee:', err)
      setError(err instanceof Error ? err.message : 'Failed to update employee')
      setTimeout(() => setError(''), 3000)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteId(employeeId)
      setDeleteLoading(true)
      setError('')
      setSuccess('')

      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Employee deleted successfully!')
      await fetchEmployees()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting employee:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete employee')
      setTimeout(() => setError(''), 3000)
    } finally {
      setDeleteLoading(false)
      setDeleteId(null)
    }
  }

  // Show loading only on first load
  if (loading && employees.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
        </div>
      </div>
    )
  }

  return (
    <>
    <ProtectedRoute allowedUser='hr'>
      <NavbarDropdown />
      <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className={`text-3xl font-bold text-[#0071BD] ${roboto.className} tracking-wider`}>
                    Employee Management
                  </h1>
                  <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide mt-1`}>
                    Manage all employees and their details
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setLoading(true)
                    fetchEmployees()
                  }}
                  className={`px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2 ${roboto.className} tracking-wider`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => router.push('/hr/add-employee')}
                  className={`px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 ${roboto.className} tracking-wider`}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </button>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded">
              <UserCheck className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className={`text-sm text-green-700 ${roboto.className} tracking-wide`}>{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className={`text-sm text-red-700 ${roboto.className} tracking-wide`}>{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, department, position, phone, or CNIC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 text-black pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide`}
                />
              </div>
              <div className="flex text-black items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm min-w-[150px] ${roboto.className} tracking-wide`}
                >
                  <option value="all">All Departments</option>
                  {departments.filter(d => d !== 'all').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow-sm p-4">
              <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Total Employees</div>
              <div className={`text-2xl font-bold text-[#0071BD] ${roboto.className} tracking-wider`}>{employees.length}</div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Departments</div>
              <div className={`text-2xl font-bold text-blue-600 ${roboto.className} tracking-wider`}>
                {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
              </div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>With CV</div>
              <div className={`text-2xl font-bold text-green-600 ${roboto.className} tracking-wider`}>
                {employees.filter(emp => emp.cv_url).length}
              </div>
            </div>
            <div className="bg-white shadow-sm p-4">
              <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>Without CV</div>
              <div className={`text-2xl font-bold text-red-600 ${roboto.className} tracking-wider`}>
                {employees.filter(emp => !emp.cv_url).length}
              </div>
            </div>
          </div>

          {/* Employees Table */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-white shadow-sm p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className={`text-gray-500 ${roboto.className} tracking-wide`}>
                {searchTerm || selectedDepartment !== 'all' ? 'No employees match your filters' : 'No employees found'}
              </p>
              {(searchTerm || selectedDepartment !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDepartment('all')
                  }}
                  className={`mt-2 text-sm text-[#0071BD] hover:underline ${roboto.className} tracking-wide`}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Employee</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>ID</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Department</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Position</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Contact</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>CV</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase ${roboto.className} tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0071BD]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#0071BD]" />
                            </div>
                            <div>
                              <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>
                                {employee.full_name || 'N/A'}
                              </p>
                              <p className={`text-xs text-gray-400 ${roboto.className} tracking-wide`}>
                                Joined: {formatDate(employee.joining_date)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>
                            {employee.employee_id || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded ${roboto.className} tracking-wide`}>
                            {employee.department || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>
                            {employee.position || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm text-gray-600 ${roboto.className} tracking-wide flex items-center gap-1`}>
                              <Phone className="w-3 h-3" />
                              {employee.phone_number || 'N/A'}
                            </span>
                            <span className={`text-xs text-gray-400 ${roboto.className} tracking-wide flex items-center gap-1`}>
                              <FileText className="w-3 h-3" />
                              {employee.cnic_number || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {employee.cv_url ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewCV(employee)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                title="View CV in new tab"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadCV(employee)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                title="Download CV"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (employee.cv_url) {
                                    const url = getFullCVUrl(employee.cv_url)
                                    if (url) window.open(url, '_blank', 'noopener,noreferrer')
                                  }
                                }}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs text-gray-400 ${roboto.className} tracking-wide`}>No CV</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(employee)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(employee)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              disabled={deleteLoading && deleteId === employee.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading && deleteId === employee.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={`px-4 py-2 text-sm text-gray-700 ${roboto.className} tracking-wide`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================== */}
      {/* VIEW DETAILS MODAL */}
      {/* ======================================== */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0071BD]/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#0071BD]" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold text-gray-800 ${roboto.className} tracking-wider`}>
                    Employee Details
                  </h2>
                  <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                    {selectedEmployee.full_name || 'Employee'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Details Section */}
              <div>
                <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
                  <User className="w-5 h-5 text-[#0071BD]" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-lg">
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Employee ID</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.employee_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Full Name</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Father Name</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.father_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>CNIC Number</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.cnic_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Phone Number</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Emergency Contact</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.emergency_contact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Date of Birth</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDate(selectedEmployee.date_of_birth)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Marital Status</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.marital_status || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Residential Address</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.residential_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Joining Date</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDate(selectedEmployee.joining_date)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Department</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Position</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Branch</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>
                      {selectedEmployee.source === 'K' ? 'Korangi' : selectedEmployee.source === 'PQ' ? 'Port Qasim' : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Username</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{selectedEmployee.username || 'N/A'}</p>
                  </div>
                  {/* CV Section */}
                  <div className="md:col-span-2">
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>CV / Resume</p>
                    {selectedEmployee.cv_url ? (
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <button
                          onClick={() => handleViewCV(selectedEmployee)}
                          className={`px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 text-sm rounded ${roboto.className} tracking-wide`}
                        >
                          <Eye className="w-4 h-4" />
                          View CV
                        </button>
                        <button
                          onClick={() => handleDownloadCV(selectedEmployee)}
                          className={`px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2 text-sm rounded ${roboto.className} tracking-wide`}
                        >
                          <Download className="w-4 h-4" />
                          Download CV
                        </button>
                        <button
                          onClick={() => {
                            if (selectedEmployee.cv_url) {
                              const url = getFullCVUrl(selectedEmployee.cv_url)
                              if (url) window.open(url, '_blank', 'noopener,noreferrer')
                            }
                          }}
                          className={`px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-2 text-sm rounded ${roboto.className} tracking-wide`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Link
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm text-gray-400 mt-1 ${roboto.className} tracking-wide`}>No CV uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Qualifications Section */}
              {selectedEmployee.qualifications && selectedEmployee.qualifications.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
                    <GraduationIcon className="w-5 h-5 text-[#0071BD]" />
                    Qualifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.qualifications.map((qual, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{qual.degree}</p>
                        <p className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>{qual.institution}</p>
                        <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                          {qual.year} {qual.grade ? `• ${qual.grade}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Section */}
              {selectedEmployee.experience && selectedEmployee.experience.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
                    <Briefcase className="w-5 h-5 text-[#0071BD]" />
                    Experience
                  </h3>
                  <div className="space-y-3">
                    {selectedEmployee.experience.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{exp.position}</p>
                        <p className={`text-sm text-gray-600 ${roboto.className} tracking-wide`}>{exp.company}</p>
                        <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                          {exp.fromDate && exp.toDate 
                            ? `${formatDate(exp.fromDate)} - ${formatDate(exp.toDate)}`
                            : 'Date not specified'}
                        </p>
                        {exp.description && (
                          <p className={`text-sm text-gray-600 mt-1 ${roboto.className} tracking-wide`}>{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Info */}
              <div>
                <h3 className={`text-lg font-semibold text-gray-800 ${roboto.className} tracking-wider mb-4 flex items-center gap-2`}>
                  <Clock className="w-5 h-5 text-[#0071BD]" />
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-lg">
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Created At</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDateTime(selectedEmployee.created_at)}</p>
                  </div>
                  <div>
                    <p className={`text-xs text-gray-500 ${roboto.className} tracking-wide`}>Last Updated</p>
                    <p className={`font-medium text-gray-800 ${roboto.className} tracking-wide`}>{formatDateTime(selectedEmployee.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* EDIT EMPLOYEE MODAL WITH CV UPLOAD */}
      {/* ======================================== */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <Edit className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold text-gray-800 ${roboto.className} tracking-wider`}>
                    Edit Employee
                  </h2>
                  <p className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                    Update employee information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {/* Personal Information Section */}
                <div>
                  <h3 className={`text-md font-semibold text-gray-700 ${roboto.className} tracking-wider mb-3 flex items-center gap-2`}>
                    <User className="w-4 h-4 text-[#0071BD]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.employee_id || ''}
                        onChange={(e) => handleEditChange('employee_id', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.full_name || ''}
                        onChange={(e) => handleEditChange('full_name', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Father Name
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.father_name || ''}
                        onChange={(e) => handleEditChange('father_name', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        CNIC Number *
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.cnic_number || ''}
                        onChange={(e) => handleEditChange('cnic_number', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.phone_number || ''}
                        onChange={(e) => handleEditChange('phone_number', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.emergency_contact || ''}
                        onChange={(e) => handleEditChange('emergency_contact', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editingEmployee.date_of_birth || ''}
                        onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Marital Status
                      </label>
                      <select
                        value={editingEmployee.marital_status || ''}
                        onChange={(e) => handleEditChange('marital_status', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Residential Address
                      </label>
                      <textarea
                        value={editingEmployee.residential_address || ''}
                        onChange={(e) => handleEditChange('residential_address', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Work Information Section */}
                <div>
                  <h3 className={`text-md font-semibold text-gray-700 ${roboto.className} tracking-wider mb-3 flex items-center gap-2`}>
                    <Briefcase className="w-4 h-4 text-[#0071BD]" />
                    Work Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={editingEmployee.joining_date || ''}
                        onChange={(e) => handleEditChange('joining_date', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Department
                      </label>
                      <select
                        value={editingEmployee.department || ''}
                        onChange={(e) => handleEditChange('department', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      >
                        <option value="">Select</option>
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
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${roboto.className} tracking-wide mb-1`}>
                        Position
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.position || ''}
                        onChange={(e) => handleEditChange('position', e.target.value)}
                        className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm ${roboto.className} tracking-wide text-black rounded`}
                      />
                    </div>
                  </div>
                </div>

                {/* ✅ CV Upload Section in Edit Modal */}
                <div>
                  <h3 className={`text-md font-semibold text-gray-700 ${roboto.className} tracking-wider mb-3 flex items-center gap-2`}>
                    <File className="w-4 h-4 text-[#0071BD]" />
                    CV / Resume
                  </h3>
                  
                  {/* Current CV Display */}
                  {editingEmployee.cv_url && !editCvFile && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="w-5 h-5 text-blue-600" />
                        <span className={`text-sm text-blue-700 ${roboto.className} tracking-wide`}>
                          Current CV: {editingEmployee.full_name || 'Employee'}_CV.pdf
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewCV(editingEmployee)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="View current CV"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadCV(editingEmployee)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition"
                          title="Download current CV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CV Upload */}
                  <div className="relative">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleEditCVUpload}
                      className="hidden"
                      id="edit-cv-upload"
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className={`px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition border border-gray-300 flex items-center gap-2 tracking-wide rounded ${roboto.className}`}
                      >
                        <Upload className="w-4 h-4" />
                        {editingEmployee.cv_url ? 'Replace CV' : 'Upload CV'}
                      </button>
                      
                      {editCvFileName && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                          <File className="w-4 h-4 text-blue-600" />
                          <span className={`text-sm text-blue-700 ${roboto.className} tracking-wide truncate max-w-[200px]`}>
                            {editCvFileName}
                          </span>
                          <button
                            type="button"
                            onClick={removeEditCV}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {editCvUploaded && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      )}
                      
                      {!editCvFileName && !editingEmployee.cv_url && (
                        <span className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                          No CV uploaded (PDF only, max 10MB)
                        </span>
                      )}
                      
                      {!editCvFileName && editingEmployee.cv_url && (
                        <span className={`text-sm text-gray-500 ${roboto.className} tracking-wide`}>
                          Keep current CV or upload a new one
                        </span>
                      )}
                    </div>
                    
                    {editCvUploading && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading new CV...
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${roboto.className} tracking-wide`}>
                    Upload employee CV/Resume in PDF format (Max size: 10MB)
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-gray-200 p-5 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition ${roboto.className} tracking-wider rounded`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || editCvUploading}
                  className={`px-6 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center gap-2 ${roboto.className} tracking-wider rounded disabled:opacity-50`}
                >
                  {editLoading || editCvUploading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editCvUploading ? 'Uploading CV...' : editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      </ProtectedRoute>
    </>
  )
}