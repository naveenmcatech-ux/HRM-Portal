// app/api/admin/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, employees, departments } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken, hashPassword } from '@/lib/auth/utils';

// GET - Fetch all employees
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

    const employeesList = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        phone: userProfiles.phone,
        departmentName: departments.name,
        departmentId: employees.departmentId,
        position: employees.position,
        employmentType: employees.employmentType,
        status: employees.status,
        joinDate: employees.joinDate,
        createdAt: users.createdAt,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(users.role, 'employee'));

    return NextResponse.json({
      success: true,
      employees: employeesList,
    });
  } catch (error) {
    console.error('Employees GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new employee
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

    const {
      email,
      password = 'Welcome123!', // Default password
      firstName,
      lastName,
      phone,
      departmentId,
      position,
      employmentType,
      salary,
      joinDate,
    } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !departmentId || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and employee in transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: 'employee',
          isActive: true,
        })
        .returning();

      // Create user profile
      await tx.insert(userProfiles).values({
        userId: user.id,
        firstName,
        lastName,
        phone,
      });

      // Create employee record
      const [employee] = await tx
        .insert(employees)
        .values({
          userId: user.id,
          departmentId,
          position,
          employmentType: employmentType || 'full_time',
          salary: salary ? parseInt(salary) : null,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          status: 'active',
        })
        .returning();

      return { user, employee };
    });

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: result,
    });
  } catch (error) {
    console.error('Employee POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}