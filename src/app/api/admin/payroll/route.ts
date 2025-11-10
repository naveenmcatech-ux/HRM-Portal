// app/api/admin/payroll/route.ts
import { db } from '@/lib/database/db';
import { payroll, employees, users, userProfiles, departments } from '@/lib/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = db
      .select({
        id: payroll.id,
        employeeId: employees.employeeId,
        employeeName: sql<string>`CONCAT(${userProfiles.firstName}, ' ', ${userProfiles.lastName})`,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        bonus: payroll.bonus,
        netSalary: payroll.netSalary,
        status: payroll.status,
        paidAt: payroll.paidAt,
        department: departments.name,
      })
      .from(payroll)
      .innerJoin(employees, eq(payroll.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id));

    if (month && year) {
      query = query.where(
        and(
          eq(payroll.month, parseInt(month)),
          eq(payroll.year, parseInt(year))
        )
      );
    }

    query = query.orderBy(desc(payroll.year), desc(payroll.month));

    const payrollList = await query;

    return NextResponse.json({
      success: true,
      payroll: payrollList,
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Process payroll for all active employees
    const activeEmployees = await db
      .select({
        id: employees.id,
        salary: employees.salary,
      })
      .from(employees)
      .where(eq(employees.isActive, true));

    const payrollRecords = activeEmployees.map(employee => ({
      employeeId: employee.id,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary: employee.salary,
      allowances: 0,
      deductions: 0,
      bonus: 0,
      netSalary: employee.salary,
      status: 'processed',
    }));

    await db.insert(payroll).values(payrollRecords);

    return NextResponse.json({
      success: true,
      message: 'Payroll processed successfully',
      recordsProcessed: payrollRecords.length,
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}