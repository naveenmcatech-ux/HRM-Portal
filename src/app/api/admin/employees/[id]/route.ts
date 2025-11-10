// app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, employees } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employeeId = params.id;

    const employeeData = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        phone: userProfiles.phone,
        departmentId: employees.departmentId,
        position: employees.position,
        employmentType: employees.employmentType,
        salary: employees.salary,
        status: employees.status,
        joinDate: employees.joinDate,
        createdAt: users.createdAt,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employeeData.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: employeeData[0],
    });
  } catch (error) {
    console.error('Employee GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { firstName, lastName, phone, departmentId, position, employmentType, salary, status } =
      await request.json();
    const employeeId = params.id;

    // Get employee's user ID
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const userId = employee[0].userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Employee has no associated user.' },
        { status: 404 }
      );
    }

    // Update in transaction
    await db.transaction(async (tx) => {
      // Update profile
      if (firstName || lastName || phone) {
        await tx
          .update(userProfiles)
          .set({
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
          })
          .where(eq(userProfiles.userId, userId));
      }

      // Update employee
      await tx
        .update(employees)
        .set({
          ...(departmentId && { departmentId }),
          ...(position && { position }),
          ...(employmentType && { employmentType }),
          ...(salary && { salary: parseInt(salary) }),
          ...(status && { status }),
        })
        .where(eq(employees.id, employeeId));
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Employee PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employeeId = params.id;

    // Get employee's user ID
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const userId = employee[0].userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Employee has no associated user.' },
        { status: 404 }
      );
    }

    // Deactivate user and employee
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      await tx
        .update(employees)
        .set({ status: 'inactive' })
        .where(eq(employees.id, employeeId));
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    console.error('Employee DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
