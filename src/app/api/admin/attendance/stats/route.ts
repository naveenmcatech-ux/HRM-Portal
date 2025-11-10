// app/api/admin/attendance/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { attendance, employees, users } from '@/lib/database/schema';
import { eq, and, gte, count, sql, avg } from 'drizzle-orm';
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total active employees
    const totalEmployeesResult = await db
      .select({ count: count() })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(users.isActive, true));

    // Get today's attendance stats
    const todayStats = await db
      .select({
        status: attendance.status,
        count: count(),
      })
      .from(attendance)
      .where(eq(attendance.date, today))
      .groupBy(attendance.status);

    // Calculate present, absent, late counts
    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    todayStats.forEach(stat => {
      if (stat.status === 'present' || stat.status === 'late' || stat.status === 'half_day') {
        presentToday += stat.count;
      }
      if (stat.status === 'absent') {
        absentToday += stat.count;
      }
      if (stat.status === 'late') {
        lateToday += stat.count;
      }
    });

    // Get average work hours for the week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const averageWorkHoursResult = await db
      .select({ avgWorkHours: avg(attendance.workHours) })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, weekStart),
          lte(attendance.date, today)
        )
      );

    const stats = {
      totalEmployees: totalEmployeesResult[0]?.count || 0,
      presentToday,
      absentToday: absentToday + (totalEmployeesResult[0]?.count - presentToday - absentToday),
      lateToday,
      averageWorkHours: averageWorkHoursResult[0]?.avgWorkHours ? 
        parseFloat(averageWorkHoursResult[0].avgWorkHours) : 0,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Attendance stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}