// app/api/admin/roles/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, departments, employees } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch all users with their roles
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

    const usersList = await db
      .select({
        id: users.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        roleName: users.role,
        departmentName: departments.name,
        isActive: users.isActive,
      })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(employees, eq(users.id, employees.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      success: true,
      users: usersList,
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}