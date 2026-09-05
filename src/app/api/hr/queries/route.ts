// app/api/hr/queries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-only client. NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const
type QueryStatus = (typeof VALID_STATUSES)[number]

// =====================================================
// GET - Fetch all queries (HR)
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let query = supabase
      .from('employee_queries')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)
    if (department && department !== 'all') query = query.eq('department', department)

    // Date-only values are converted to full-day boundaries.
    if (fromDate) query = query.gte('created_at', `${fromDate}T00:00:00.000Z`)
    if (toDate) query = query.lt('created_at', `${toDate}T23:59:59.999Z`)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const stats = {
      total: rows.length,
      pending: rows.filter((q: any) => q.status === 'Pending').length,
      inProgress: rows.filter((q: any) => q.status === 'In Progress').length,
      resolved: rows.filter((q: any) => q.status === 'Resolved').length,
      rejected: rows.filter((q: any) => q.status === 'Rejected').length,
    }

    const departments = [
      ...new Set(rows.map((q: any) => q.department).filter(Boolean)),
    ]

    return NextResponse.json(
      { success: true, data: rows, stats, departments, count: rows.length },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error fetching queries:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch queries',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT - Update query status (HR)
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const status = typeof body.status === 'string' ? body.status.trim() : ''
    const adminRemarks =
      typeof body.adminRemarks === 'string' ? body.adminRemarks.trim() : ''

    console.log('PUT /api/hr/queries:', { id, status, hasRemarks: Boolean(adminRemarks) })

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Query ID is required' },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status as QueryStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Allowed: Pending, In Progress, Resolved, Rejected',
        },
        { status: 400 }
      )
    }

    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Send null when remarks are cleared; otherwise save the new remarks.
    if (body.adminRemarks !== undefined) {
      updateData.admin_remarks = adminRemarks
    }

    const { data, error } = await supabase
      .from('employee_queries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Supabase UPDATE error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Query not found or could not be updated' },
        { status: 404 }
      )
    }

    console.log('Query updated:', data.id, data.status)

    return NextResponse.json({
      success: true,
      data,
      message: `Query status updated to ${status} successfully`,
    })
  } catch (error) {
    console.error('Error updating query:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update query',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE - Delete a query (HR)
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Query ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('employee_queries')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Query not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting query:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete query',
      },
      { status: 500 }
    )
  }
}
