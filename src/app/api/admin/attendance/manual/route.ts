// app/api/admin/attendance/manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { attendance } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

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
      message: 'Attendance record updated successfully',
      attendance: result,
    });
  } catch (error) {
    console.error('Manual attendance POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}