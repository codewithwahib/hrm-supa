// app/api/queries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// GET - Fetch employee queries
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('employee_queries')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error fetching employee queries:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch queries' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST - Submit a new query (Employee)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      employee_id,
      name,
      department,
      designation,
      subject,
      query,
    } = body

    // Validation
    if (!employee_id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Employee name is required' },
        { status: 400 }
      )
    }

    if (!subject || subject.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Subject must be at least 5 characters' },
        { status: 400 }
      )
    }

    if (!query || query.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: 'Query must be at least 20 characters' },
        { status: 400 }
      )
    }

    // Insert into employee_queries table
    const { data, error } = await supabase
      .from('employee_queries')
      .insert({
        employee_id: employee_id,
        name: name,
        department: department || '',
        designation: designation || '',
        subject: subject.trim(),
        query: query.trim(),
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
      message: 'Query submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting query:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit query' },
      { status: 500 }
    )
  }
}