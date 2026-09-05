import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const branch = searchParams.get('branch')
    const device = searchParams.get('device')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    // Count exact count along with limited data fetching
    let query = supabase
      .from('attendance_logs')
      .select('id, user_id, employee_name, timestamp, punch_type, device_id, branch_code, raw_log_key', { count: 'exact' })

    if (date) {
      query = query
        .gte('timestamp', `${date} 00:00:00`)
        .lte('timestamp', `${date} 23:59:59`)
    }

    if (branch && branch !== 'all') query = query.eq('branch_code', branch)
    if (device && device !== 'all') query = query.eq('device_id', device)
    
    if (search && search.trim()) {
      query = query.or(`employee_name.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%`)
    }

    // ORDER BY timestamp DESC LIMIT
    query = query.order('timestamp', { ascending: false }).limit(limit)

    const { data, count, error } = await query

    if (error) {
      console.error('Supabase Query Error:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      totalRecords: count || 0
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}