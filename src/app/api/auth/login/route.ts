import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, employees, hrManagers, departments, designations } from '@/lib/database/schema';
import { verifyPassword, generateToken } from '@/lib/auth/utils';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { user, profile, employee, hrManager, department, designation } = userData[0];

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    const token = generateToken(user.id, user.role);

    cookies().set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

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

    return NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
