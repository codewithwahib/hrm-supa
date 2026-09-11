// src/app/api/hr/employees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(
        'id, employee_id, full_name, father_name, department, position, shift, joining_date, cnic_number, phone_number'
      )
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const employees = (data || []).map((e) => ({
      id: e.id,
      employeeId: e.employee_id,
      fullName: e.full_name,
      fatherName: e.father_name || '',
      department: e.department || '',
      position: e.position || '',
      shift: e.shift || '',
      joiningDate: e.joining_date || '',
      cnicNumber: e.cnic_number || '',
      phoneNumber: e.phone_number || '',
    }))

    return NextResponse.json({ success: true, employees })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch',
      },
      { status: 500 }
    )
  }
}