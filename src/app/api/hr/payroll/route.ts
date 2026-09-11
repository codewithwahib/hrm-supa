// src/app/api/hr/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const b = await request.json()

    const row = {
      employee_id: b.employeeId,
      name: b.name,
      designation: b.designation,
      cnic: b.cnic,

      total_increase: b.totalIncrease ?? 0,
      gross: b.gross ?? 0,
      total_gross_after_increa: b.totalGrossAfterIncrease ?? 0,

      basic_salary: b.basicSalary ?? 0,
      per_month_salary: b.perMonthSalary ?? 0,
      per_day: b.perDay ?? 0,

      present_day: b.presentDay ?? 0,
      present_amount: b.presentAmount ?? 0,
      absent_day: b.absentDay ?? 0,
      absent_amount: b.absentAmount ?? 0,
      approvl_lvn: b.approvlLvn ?? 0,
      total_salary_days: b.totalSalaryDays ?? 0,

      duty_hours: b.dutyHours ?? 8,
      pr_hours: b.prHours ?? 0,
      total_month_hours: b.totalMonthHours ?? 0,

      late_hours: b.lateHours ?? 0,
      late_hour_amount: b.lateHourAmount ?? 0,
      salary_exp: b.salaryExp ?? 0,

      approvl_lvn_2: b.approvlLvn2 ?? 0,
      over_time_hour: b.overTimeHour ?? 0,
      over_time: b.overTime ?? 0,

      hold_salary: b.holdSalary ?? 0,
      deduct_health_insurance: b.deductHealthInsurance ?? 0,
      total_salary: b.totalSalary ?? 0,

      loan: b.loan ?? 0,
      adv_salary: b.advSalary ?? 0,
      income_tax: b.incomeTax ?? 0,
      net_salary_payable: b.netSalaryPayable ?? 0,

      month_year: b.monthYear,
    }

    const { data, error } = await supabase
      .from('payroll')
      .insert([row])
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, payroll: data?.[0] })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save',
      },
      { status: 500 }
    )
  }
}