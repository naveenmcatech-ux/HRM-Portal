// app/api/admin/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { attendance, employees, userProfiles, departments, users } from '@/lib/database/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const view = searchParams.get('view') || 'daily';
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    let attendanceQuery;

    if (view === 'daily') {
      // Get attendance for specific date
      attendanceQuery = db
        .select({
          id: attendance.id,
          employeeId: attendance.employeeId,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          email: users.email,
          departmentName: departments.name,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workHours: attendance.workHours,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        })
        .from(attendance)
        .innerJoin(employees, eq(attendance.employeeId, employees.id))
        .innerJoin(users, eq(employees.userId, users.id))
        .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            eq(attendance.date, new Date(date)),
            ...(department ? [eq(departments.name, department)] : []),
            ...(status ? [eq(attendance.status, status)] : [])
          )
        )
        .orderBy(desc(attendance.checkIn));
    } else {
      // Monthly view - get summary for the month
      const startDate = new Date(date);
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      attendanceQuery = db
        .select({
          id: attendance.id,
          employeeId: attendance.employeeId,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          email: users.email,
          departmentName: departments.name,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workHours: attendance.workHours,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        })
        .from(attendance)
        .innerJoin(employees, eq(attendance.employeeId, employees.id))
        .innerJoin(users, eq(employees.userId, users.id))
        .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            gte(attendance.date, startDate),
            lte(attendance.date, endDate),
            ...(department ? [eq(departments.name, department)] : []),
            ...(status ? [eq(attendance.status, status)] : [])
          )
        )
        .orderBy(desc(attendance.date));
    }

    const attendanceRecords = await attendanceQuery;

    return NextResponse.json({
      success: true,
      attendance: attendanceRecords,
    });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Manual attendance entry
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId, date, checkIn, checkOut } = await request.json();

    if (!employeeId || !date) {
      return NextResponse.json(
        { error: 'Employee ID and date are required' },
        { status: 400 }
      );
    }

    // Calculate work hours and status
    let workHours = 0;
    let status = 'present';
    let lateMinutes = 0;

    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Check if late (after 9:30 AM)
      const expectedCheckIn = new Date(checkIn);
      expectedCheckIn.setHours(9, 30, 0, 0);
      
      if (checkInTime > expectedCheckIn) {
        lateMinutes = Math.round((checkInTime.getTime() - expectedCheckIn.getTime()) / (1000 * 60));
        status = 'late';
      }

      // Check if half day (less than 4 hours)
      if (workHours < 4) {
        status = 'half_day';
      }
    } else if (!checkIn && !checkOut) {
      status = 'absent';
    }

    // Check if record already exists
    const existingRecord = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employeeId),
          eq(attendance.date, new Date(date))
        )
      )
      .limit(1);

    let result;

    if (existingRecord.length > 0) {
      // Update existing record
      [result] = await db
        .update(attendance)
        .set({
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          workHours,
          status,
          lateMinutes,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existingRecord[0].id))
        .returning();
    } else {
      // Create new record
      [result] = await db
        .insert(attendance)
        .values({
          employeeId,
          date: new Date(date),
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          workHours,
          status,
          lateMinutes,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record saved successfully',
      attendance: result,
    });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}