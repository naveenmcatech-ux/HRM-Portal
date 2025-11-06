import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, employees, hrManagers, departments, designations } from '@/lib/database/schema';
import { verifyToken } from '@/lib/auth/utils';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userData = await db
      .select({
        user: users,
        profile: userProfiles,
        employee: employees,
        hrManager: hrManagers,
        department: departments,
        designation: designations,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(employees, eq(users.id, employees.userId))
      .leftJoin(hrManagers, eq(users.id, hrManagers.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(and(eq(users.id, decoded.userId), eq(users.isActive, true)))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { user, profile, employee, hrManager, department, designation } = userData[0];

    let userResponse: any = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      avatar: profile?.avatar,
    };

    if (user.role === 'employee' && employee) {
      userResponse.employee = {
        employeeId: employee.employeeId,
        department: department?.name,
        designation: designation?.name,
      };
    }

    if (user.role === 'hr' && hrManager) {
      userResponse.hrManager = {
        departmentId: hrManager.departmentId,
      };
    }

    return NextResponse.json({ user: userResponse });

  } catch (error) {
    console.error('Me endpoint error:', error);
    // If token is invalid or expired, clear it
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        response.cookies.delete('auth-token');
        return response;
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// This import is necessary for the catch block to work correctly with JWT error types
import * as jwt from 'jsonwebtoken';
