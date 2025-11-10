import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth/utils';
import { db } from '@/lib/database/db';
import { users, userProfiles } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Default admin credentials
    if (username === 'Admin' && password === 'Admin123') {
      // Check if admin user exists
      const adminUserResult = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(users.email, 'admin@hrms.com'))
        .limit(1);

      let adminUser;

      if (adminUserResult.length === 0) {
        // Create admin user
        const newAdmin = await db.insert(users).values({
          email: 'admin@hrms.com',
          password: 'Admin123', // WARNING: Storing plain text passwords is a security risk.
          role: 'admin',
        }).returning({ id: users.id });

        const adminId = newAdmin[0].id;

        await db.insert(userProfiles).values({
          userId: adminId,
          firstName: 'System',
          lastName: 'Administrator',
        });

        adminUser = {
            username: 'Admin',
            role: 'admin',
            firstName: 'System',
            lastName: 'Administrator'
        };
      } else {
        const existingUser = adminUserResult[0];
        adminUser = {
            username: 'Admin', // The username is hardcoded to 'Admin' for this special login
            role: existingUser.role,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName
        };
      }

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: adminUser
      });

      // Set session cookie
      response.cookies.set('hrms-session', 'admin-authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return response;
    }

    // Placeholder for other user authentication
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
