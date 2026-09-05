// // src/app/site-visit/[employeeId]/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import NavbarDropdown from '@/app/Navbar/page'
// import ProtectedEmployeeRoute from '@/components/ProtectedEmployeeRoute'
// import Footer from '@/components/footer'
// import { useParams, useRouter } from 'next/navigation'
// import {
//   Calendar,
//   Clock,
//   User,
//   Building,
//   FileText,
//   MessageCircle,
//   AlertCircle,
//   Check,
//   X,
//   Loader,
//   ArrowLeft,
//   MapPin,
//   Briefcase,
//   Users,
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
//   _id: string
//   personalDetails: {
//     employeeId: string
//     fullName: string
//     department?: string
//     position?: string
//   }
// }

// export default function SiteVisitPage() {
//   const params = useParams()
//   const router = useRouter()
//   const employeeId = typeof params.employeeId === 'string' ? params.employeeId : ''

//   const [employee, setEmployee] = useState<Employee | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState(false)
//   const [successMessage, setSuccessMessage] = useState('')
//   const [isSiteVisitEnabled, setIsSiteVisitEnabled] = useState(false)

//   // Get current date in YYYY-MM-DD format
//   const getCurrentDate = () => {
//     const today = new Date()
//     const year = today.getFullYear()
//     const month = String(today.getMonth() + 1).padStart(2, '0')
//     const day = String(today.getDate()).padStart(2, '0')
//     return `${year}-${month}-${day}`
//   }

//   // Hidden location state (not shown to user)
//   const [hiddenLocation, setHiddenLocation] = useState({
//     latitude: 0,
//     longitude: 0,
//     accuracy: 0,
//     address: '',
//     locationTimestamp: '',
//   })

//   const [formData, setFormData] = useState({
//     companyName: '',
//     customerName: '',
//     projectName: '',
//     salesPerson: '',
//     visitDate: getCurrentDate(), // ✅ Auto-set current date
//     fromTime: '',
//     toTime: '',
//     location: '',
//     followUps: '',
//     notes: '',
//   })

//   useEffect(() => {
//     if (!employeeId) {
//       setError('Employee ID is missing.')
//       setLoading(false)
//       return
//     }

//     const fetchEmployee = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch(
//           `/api/site-visit?employeeId=${encodeURIComponent(employeeId)}`,
//           { method: 'GET', cache: 'no-store' }
//         )

//         const result = await response.json()

//         if (!response.ok || !result.success) {
//           throw new Error(result.error || 'Failed to load employee')
//         }

//         if (!result.data) {
//           throw new Error('Employee data not found')
//         }

//         setEmployee(result.data)
        
//         // Check if site visits are enabled
//         setIsSiteVisitEnabled(result.data.enableSiteVisits || false)
        
//         // Set initial form data
//         setFormData((prev) => ({
//           ...prev,
//           salesPerson: result.data?.personalDetails?.fullName || '',
//           visitDate: getCurrentDate(), // ✅ Set current date
//         }))

//         // Get location silently in background
//         getLocationSilently()

//       } catch (err) {
//         console.error('Employee loading error:', err)
//         setError(err instanceof Error ? err.message : 'Failed to load employee')
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchEmployee()
//   }, [employeeId])

//   // Get location silently (no user prompt)
//   const getLocationSilently = () => {
//     if (!navigator.geolocation) {
//       console.log('Geolocation not supported')
//       return
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const { latitude, longitude, accuracy } = position.coords
//         setHiddenLocation({
//           latitude,
//           longitude,
//           accuracy,
//           address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
//           locationTimestamp: new Date().toISOString(),
//         })
//         console.log('📍 Location captured silently:', { latitude, longitude })
//       },
//       (error) => {
//         console.log('Location access denied or failed:', error.message)
//         // Silent fail - don't show error to user
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 5000,
//         maximumAge: 0,
//       }
//     )
//   }

//   // Get location on submit if not already captured
//   const getLocationForSubmit = (): Promise<{
//     latitude: number
//     longitude: number
//     accuracy: number
//     address: string
//     timestamp: string
//   }> => {
//     return new Promise((resolve) => {
//       // If we already have location, use it
//       if (hiddenLocation.latitude !== 0 && hiddenLocation.longitude !== 0) {
//         resolve({
//           latitude: hiddenLocation.latitude,
//           longitude: hiddenLocation.longitude,
//           accuracy: hiddenLocation.accuracy,
//           address: hiddenLocation.address,
//           timestamp: hiddenLocation.locationTimestamp,
//         })
//         return
//       }

//       // Try to get fresh location
//       if (!navigator.geolocation) {
//         resolve({
//           latitude: 0,
//           longitude: 0,
//           accuracy: 0,
//           address: '',
//           timestamp: '',
//         })
//         return
//       }

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude, accuracy } = position.coords
//           resolve({
//             latitude,
//             longitude,
//             accuracy,
//             address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
//             timestamp: new Date().toISOString(),
//           })
//         },
//         () => {
//           // Silent fail
//           resolve({
//             latitude: 0,
//             longitude: 0,
//             accuracy: 0,
//             address: '',
//             timestamp: '',
//           })
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 3000,
//           maximumAge: 0,
//         }
//       )
//     })
//   }

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault()
//     setError(null)
//     setSuccess(false)
//     setSuccessMessage('')

//     // Validations
//     if (!formData.companyName.trim()) {
//       setError('Please enter company name.')
//       return
//     }
//     if (!formData.customerName.trim()) {
//       setError('Please enter customer name.')
//       return
//     }
//     if (!formData.visitDate) {
//       setError('Please select visit date.')
//       return
//     }
//     if (!formData.fromTime) {
//       setError('Please enter from time.')
//       return
//     }
//     if (!formData.toTime) {
//       setError('Please enter to time.')
//       return
//     }
//     if (!formData.location.trim()) {
//       setError('Please enter visit location.')
//       return
//     }

//     try {
//       setSubmitting(true)

//       // Get location silently for submission
//       const locationData = await getLocationForSubmit()

//       const response = await fetch('/api/site-visit', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//         body: JSON.stringify({
//           employeeId: employeeId,
//           companyName: formData.companyName.trim(),
//           customerName: formData.customerName.trim(),
//           projectName: formData.projectName.trim(),
//           salesPerson: formData.salesPerson.trim(),
//           visitDate: formData.visitDate,
//           fromTime: formData.fromTime,
//           toTime: formData.toTime,
//           location: formData.location.trim(),
//           followUps: formData.followUps.trim(),
//           notes: formData.notes.trim(),
//           liveLocation: {
//             latitude: locationData.latitude,
//             longitude: locationData.longitude,
//             accuracy: locationData.accuracy,
//             address: locationData.address,
//             timestamp: locationData.timestamp,
//           },
//         }),
//       })

//       const result = await response.json()

//       if (!response.ok || !result.success) {
//         throw new Error(result.error || 'Failed to submit site visit')
//       }

//       // ✅ Success
//       setSuccess(true)
//       setSuccessMessage(`✅ Site visit to ${formData.companyName} has been recorded successfully!`)
      
//       // Clear form (keep date and sales person)
//       setFormData((prev) => ({
//         ...prev,
//         companyName: '',
//         customerName: '',
//         projectName: '',
//         fromTime: '',
//         toTime: '',
//         location: '',
//         followUps: '',
//         notes: '',
//         visitDate: getCurrentDate(), // ✅ Keep current date
//       }))

//       // Auto-hide success message after 8 seconds
//       setTimeout(() => {
//         setSuccess(false)
//         setSuccessMessage('')
//       }, 8000)

//     } catch (err) {
//       console.error('Site visit submit error:', err)
//       setError(err instanceof Error ? err.message : 'Failed to submit site visit')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center">
//           <Loader className="w-12 h-12 animate-spin text-[#0071BD] mx-auto mb-4" />
//         </div>
//       </div>
//     )
//   }

//   if (!isSiteVisitEnabled) {
//     return (
//       <>
//         <ProtectedEmployeeRoute allowedRole='employee'>
//           <NavbarDropdown />
//           <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
//             <div className="max-w-4xl mx-auto">
//               <div className="bg-white shadow-sm p-8 text-center">
//                 <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">
//                   Site Visit Disabled
//                 </h3>
//                 <p className="text-gray-600 mb-4 tracking-wide">
//                   Site visit records are not enabled for your account. 
//                   Please contact your administrator.
//                 </p>
//                 <button
//                   onClick={() => router.push(`/dashboard/${employeeId}`)}
//                   className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
//                 >
//                   Go to Dashboard
//                 </button>
//               </div>
//             </div>
//           </div>
//           <Footer />
//         </ProtectedEmployeeRoute>
//       </>
//     )
//   }

//   if (error && !employee) {
//     return (
//       <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${roboto.className}`}>
//         <div className="text-center bg-white shadow-sm p-8 max-w-md">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">Error</h3>
//           <p className="text-gray-600 mb-4 tracking-wide">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <>
//       <ProtectedEmployeeRoute allowedRole='employee'>
//         <NavbarDropdown />
//         <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
//           <div className="max-w-4xl mx-auto">
//             {/* Header */}
//             <div className="mb-6">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                 <div className="flex items-center gap-3">
//                   <div>
//                     <h1 className="text-3xl font-bold text-[#0071BD] tracking-wider">
//                       Site Visit Form
//                     </h1>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => router.push(`/dashboard/${employeeId}`)}
//                   className="flex items-center gap-2 px-4 py-2 bg-[#0071BD] hover:bg-[#005a96] transition tracking-wider"
//                 >
//                   <ArrowLeft className="w-4 h-4" />
//                   Back to Dashboard
//                 </button>
//               </div>
//             </div>

//             {/* ✅ Success Message */}
//             {success && (
//               <div className="mb-6 p-4 flex items-start gap-3 bg-green-50 border-l-4 border-green-500 shadow-md animate-in slide-in-from-top-5 duration-300">
//                 <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <p className="text-sm text-green-700 tracking-wide font-semibold">
//                     ✅ Success!
//                   </p>
//                   <p className="text-sm text-green-600 tracking-wide mt-1">
//                     {successMessage}
//                   </p>
//                   <p className="text-xs text-green-500 tracking-wide mt-2">
//                     You can submit another site visit or go back to dashboard.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setSuccess(false)
//                     setSuccessMessage('')
//                   }}
//                   className="flex-shrink-0 text-green-500 hover:text-green-700 transition"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//             )}

//             {/* ❌ Error Message */}
//             {error && employee && (
//               <div className="mb-6 p-4 flex items-start gap-3 bg-red-50 border-l-4 border-red-500 shadow-md">
//                 <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <p className="text-sm text-red-700 tracking-wide font-semibold">❌ Error</p>
//                   <p className="text-sm text-red-600 tracking-wide mt-1">{error}</p>
//                 </div>
//                 <button
//                   onClick={() => setError(null)}
//                   className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//             )}

//             {/* Form */}
//             <div className="bg-white shadow-sm overflow-hidden">
//               <div className="p-6 border-b border-gray-200">
//                 <h2 className="text-xl font-bold text-gray-800 tracking-wider flex items-center gap-2">
//                   <MapPin className="w-5 h-5 text-[#0071BD]" />
//                   Site Visit Record
//                 </h2>
//                 <p className="text-sm text-gray-500 tracking-wide mt-1">Record a new site visit</p>
//               </div>

//               <form onSubmit={handleSubmit} className="p-6 space-y-6">


//                 {/* Site Visit Details */}
//                 <div>
//                   <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
//                     <Briefcase className="w-4 h-4" />
//                     Site Visit Details
//                   </h3>
//                   <div className="grid text-black grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Company Name *
//                       </label>
//                       <div className="relative">
//                         <Building className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           name="companyName"
//                           value={formData.companyName}
//                           onChange={handleChange}
//                           required
//                           disabled={submitting}
//                           placeholder="Enter company name"
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Customer Name *
//                       </label>
//                       <div className="relative">
//                         <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           name="customerName"
//                           value={formData.customerName}
//                           onChange={handleChange}
//                           required
//                           disabled={submitting}
//                           placeholder="Enter customer name"
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Project Name
//                       </label>
//                       <div className="relative">
//                         <FileText className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           name="projectName"
//                           value={formData.projectName}
//                           onChange={handleChange}
//                           disabled={submitting}
//                           placeholder="Enter project name"
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Sales Person
//                       </label>
//                       <div className="relative">
//                         <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           name="salesPerson"
//                           value={formData.salesPerson}
//                           onChange={handleChange}
//                           disabled
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm tracking-wide"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Visit Date *
//                       </label>
//                       <div className="relative">
//                         <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="date"
//                           name="visitDate"
//                           value={formData.visitDate}
//                           onChange={handleChange}
//                           required
//                           disabled // ✅ Non-editable
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm tracking-wide"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Visit Location *
//                       </label>
//                       <div className="relative">
//                         <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           name="location"
//                           value={formData.location}
//                           onChange={handleChange}
//                           required
//                           disabled={submitting}
//                           placeholder="Enter visit location"
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         From Time *
//                       </label>
//                       <div className="relative">
//                         <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="time"
//                           name="fromTime"
//                           value={formData.fromTime}
//                           onChange={handleChange}
//                           required
//                           disabled={submitting}
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         To Time *
//                       </label>
//                       <div className="relative">
//                         <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="time"
//                           name="toTime"
//                           value={formData.toTime}
//                           onChange={handleChange}
//                           required
//                           disabled={submitting}
//                           className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Follow Ups & Notes */}
//                 <div>
//                   <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
//                     <MessageCircle className="w-4 h-4" />
//                     Additional Information
//                   </h3>
//                   <div className="grid grid-cols-1 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Follow-Ups
//                       </label>
//                       <div className="relative">
//                         <MessageCircle className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
//                         <textarea
//                           name="followUps"
//                           value={formData.followUps}
//                           onChange={handleChange}
//                           disabled={submitting}
//                           rows={3}
//                           placeholder="Enter any follow-up notes"
//                           className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide resize-none disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
//                         Visit Notes
//                       </label>
//                       <div className="relative">
//                         <FileText className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
//                         <textarea
//                           name="notes"
//                           value={formData.notes}
//                           onChange={handleChange}
//                           disabled={submitting}
//                           rows={3}
//                           placeholder="Enter any additional notes about the site visit"
//                           className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide resize-none disabled:bg-gray-100"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Buttons */}
//                 <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
//                   <button
//                     type="submit"
//                     disabled={submitting}
//                     className="flex-1 px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition flex items-center justify-center gap-2 disabled:opacity-50 tracking-wider"
//                   >
//                     {submitting ? (
//                       <Loader className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Check className="w-4 h-4" />
//                     )}
//                     {submitting ? 'Submitting...' : 'Submit Site Visit'}
//                   </button>
//                   <button
//                     type="button"
//                     disabled={submitting}
//                     onClick={() => router.push(`/dashboard/${employeeId}`)}
//                     className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition tracking-wider"
//                   >
//                     Go to Dashboard
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//         <Footer />
//       </ProtectedEmployeeRoute>
//     </>
//   )
// }


// src/app/site-visit/[employeeId]/page.tsx
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
  MapPin,
  Briefcase,
  Users,
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
  enable_site_visits?: boolean
}

// ✅ Supabase client - MOVED OUTSIDE component (created once)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SiteVisitPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = typeof params.employeeId === 'string' ? params.employeeId : ''

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isSiteVisitEnabled, setIsSiteVisitEnabled] = useState(false)

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Hidden location state (not shown to user)
  const [hiddenLocation, setHiddenLocation] = useState({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    address: '',
    locationTimestamp: '',
  })

  const [formData, setFormData] = useState({
    companyName: '',
    customerName: '',
    projectName: '',
    salesPerson: '',
    visitDate: getCurrentDate(),
    fromTime: '',
    toTime: '',
    location: '',
    followUps: '',
    notes: '',
  })

  // =====================================================
  // fetchEmployee - UPDATED FOR SUPABASE
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

      // ✅ Fetch employee from Supabase
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('id, employee_id, full_name, department, position, enable_site_visits')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!data) {
        throw new Error('Employee data not found')
      }

      const transformedEmployee: Employee = {
        id: data.id,
        employee_id: data.employee_id,
        full_name: data.full_name,
        department: data.department || '',
        position: data.position || '',
        enable_site_visits: data.enable_site_visits || false
      }

      setEmployee(transformedEmployee)
      
      // Check if site visits are enabled
      setIsSiteVisitEnabled(transformedEmployee.enable_site_visits || false)
      
      // Set initial form data
      setFormData((prev) => ({
        ...prev,
        salesPerson: transformedEmployee.full_name || '',
        visitDate: getCurrentDate(),
      }))

      // Get location silently in background
      getLocationSilently()

    } catch (err) {
      console.error('Employee loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load employee')
    } finally {
      setLoading(false)
    }
  }, [employeeId]) // ✅ Removed supabase dependency

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  // Get location silently (no user prompt)
  const getLocationSilently = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setHiddenLocation({
          latitude,
          longitude,
          accuracy,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          locationTimestamp: new Date().toISOString(),
        })
        console.log('📍 Location captured silently:', { latitude, longitude })
      },
      (error) => {
        console.log('Location access denied or failed:', error.message)
        // Silent fail - don't show error to user
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  // Get location on submit if not already captured
  const getLocationForSubmit = (): Promise<{
    latitude: number
    longitude: number
    accuracy: number
    address: string
    timestamp: string
  }> => {
    return new Promise((resolve) => {
      // If we already have location, use it
      if (hiddenLocation.latitude !== 0 && hiddenLocation.longitude !== 0) {
        resolve({
          latitude: hiddenLocation.latitude,
          longitude: hiddenLocation.longitude,
          accuracy: hiddenLocation.accuracy,
          address: hiddenLocation.address,
          timestamp: hiddenLocation.locationTimestamp,
        })
        return
      }

      // Try to get fresh location
      if (!navigator.geolocation) {
        resolve({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          address: '',
          timestamp: '',
        })
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          resolve({
            latitude,
            longitude,
            accuracy,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            timestamp: new Date().toISOString(),
          })
        },
        () => {
          // Silent fail
          resolve({
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            address: '',
            timestamp: '',
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 3000,
          maximumAge: 0,
        }
      )
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // =====================================================
  // handleSubmit - UPDATED FOR SUPABASE
  // =====================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSuccessMessage('')

    // Validations
    if (!formData.companyName.trim()) {
      setError('Please enter company name.')
      return
    }
    if (!formData.customerName.trim()) {
      setError('Please enter customer name.')
      return
    }
    if (!formData.visitDate) {
      setError('Please select visit date.')
      return
    }
    if (!formData.fromTime) {
      setError('Please enter from time.')
      return
    }
    if (!formData.toTime) {
      setError('Please enter to time.')
      return
    }
    if (!formData.location.trim()) {
      setError('Please enter visit location.')
      return
    }

    try {
      setSubmitting(true)

      // ✅ Get current employee data
      const { data: employeeData, error: fetchError } = await supabase
        .from('employees')
        .select('site_visits')
        .eq('employee_id', employeeId)
        .maybeSingle()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!employeeData) {
        throw new Error('Employee not found')
      }

      // Get location silently for submission
      const locationData = await getLocationForSubmit()

      // Create new site visit record
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 9)
      const siteVisitKey = `visit_${timestamp}_${randomStr}`

      const newVisit = {
        _key: siteVisitKey,
        _type: 'siteVisit',
        companyName: formData.companyName.trim(),
        customerName: formData.customerName.trim(),
        projectName: formData.projectName.trim() || '',
        salesPerson: formData.salesPerson.trim() || '',
        visitDate: formData.visitDate,
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        location: formData.location.trim(),
        followUps: formData.followUps.trim() || '',
        notes: formData.notes.trim() || '',
        liveLocation: {
          latitude: locationData.latitude || 0,
          longitude: locationData.longitude || 0,
          accuracy: locationData.accuracy || 0,
          address: locationData.address || '',
          timestamp: locationData.timestamp || new Date().toISOString()
        }
      }

      // ✅ Get existing site visits or initialize empty array
      const currentVisits = employeeData.site_visits || []
      const updatedVisits = [...currentVisits, newVisit]

      // ✅ Update employee in Supabase
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          site_visits: updatedVisits,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // ✅ Success
      setSuccess(true)
      setSuccessMessage(`✅ Site visit to ${formData.companyName} has been recorded successfully!`)
      
      // Clear form (keep date and sales person)
      setFormData((prev) => ({
        ...prev,
        companyName: '',
        customerName: '',
        projectName: '',
        fromTime: '',
        toTime: '',
        location: '',
        followUps: '',
        notes: '',
        visitDate: getCurrentDate(),
      }))

      // Auto-hide success message after 8 seconds
      setTimeout(() => {
        setSuccess(false)
        setSuccessMessage('')
      }, 8000)

    } catch (err) {
      console.error('Site visit submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit site visit')
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

  if (!isSiteVisitEnabled) {
    return (
      <>
        <ProtectedEmployeeRoute allowedRole='employee'>
          <NavbarDropdown />
          <div className={`min-h-screen bg-gray-50 p-6 ${roboto.className}`}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-sm p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-wider">
                  Site Visit Disabled
                </h3>
                <p className="text-gray-600 mb-4 tracking-wide">
                  Site visit records are not enabled for your account. 
                  Please contact your administrator.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/${employeeId}`)}
                  className="px-4 py-2 bg-[#0071BD] text-white hover:bg-[#005a96] transition tracking-wider"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </ProtectedEmployeeRoute>
      </>
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
                      Site Visit Form
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
                    You can submit another site visit or go back to dashboard.
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
                  <MapPin className="w-5 h-5 text-[#0071BD]" />
                  Site Visit Record
                </h2>
                <p className="text-sm text-gray-500 tracking-wide mt-1">Record a new site visit</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {/* Site Visit Details */}
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
                    <Briefcase className="w-4 h-4" />
                    Site Visit Details
                  </h3>
                  <div className="grid text-black grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Company Name *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          placeholder="Enter company name"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Customer Name *
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          placeholder="Enter customer name"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Project Name
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="projectName"
                          value={formData.projectName}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="Enter project name"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Sales Person
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="salesPerson"
                          value={formData.salesPerson}
                          onChange={handleChange}
                          disabled
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm tracking-wide"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Visit Date *
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          name="visitDate"
                          value={formData.visitDate}
                          onChange={handleChange}
                          required
                          disabled
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm tracking-wide"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Visit Location *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          placeholder="Enter visit location"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        From Time *
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="time"
                          name="fromTime"
                          value={formData.fromTime}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        To Time *
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="time"
                          name="toTime"
                          value={formData.toTime}
                          onChange={handleChange}
                          required
                          disabled={submitting}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow Ups & Notes */}
                <div>
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 tracking-wider mb-4">
                    <MessageCircle className="w-4 h-4" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Follow-Ups
                      </label>
                      <div className="relative">
                        <MessageCircle className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <textarea
                          name="followUps"
                          value={formData.followUps}
                          onChange={handleChange}
                          disabled={submitting}
                          rows={3}
                          placeholder="Enter any follow-up notes"
                          className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide resize-none disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Visit Notes
                      </label>
                      <div className="relative">
                        <FileText className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          disabled={submitting}
                          rows={3}
                          placeholder="Enter any additional notes about the site visit"
                          className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#0071BD] focus:border-transparent outline-none shadow-sm tracking-wide resize-none disabled:bg-gray-100"
                        />
                      </div>
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
                      <Check className="w-4 h-4" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Site Visit'}
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