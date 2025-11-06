import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, employees, hrManagers } from '@/lib/database/schema';
import { hashPassword, generateToken } from '@/lib/auth/utils';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phone,
      employeeId,
      departmentId,
      designationId
    } = await request.json();

    if (!email || !password || !role || !firstName || !lastName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['admin', 'hr', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role,
          isActive: true,
        })
        .returning();

      await tx
        .insert(userProfiles)
        .values({
          userId: user.id,
          firstName,
          lastName,
          phone,
        });

      if (role === 'employee') {
         if (!employeeId || !departmentId || !designationId) {
            throw new Error('Missing fields for employee role');
         }
        await tx
          .insert(employees)
          .values({
            userId: user.id,
            employeeId,
            departmentId,
            designationId,
            isActive: true,
          });
      }

      if (role === 'hr') {
        if (!departmentId) {
            throw new Error('Missing department for HR role');
        }
        await tx
          .insert(hrManagers)
          .values({
            userId: user.id,
            departmentId,
            isActive: true,
          });
      }

      return user;
    });

    const token = generateToken(result.id, role);

    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
