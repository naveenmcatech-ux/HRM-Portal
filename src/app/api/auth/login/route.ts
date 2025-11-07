import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/database/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Default admin credentials
    if (username === 'Admin' && password === 'Admin123') {
      // Check if admin user exists, if not create it
      let adminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, 'Admin'))
        .limit(1);

      if (adminUser.length === 0) {
        // Create admin user
        const newAdmin = await db.insert(users).values({
          username: 'Admin',
          email: 'admin@hrms.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin',
        }).returning();
        adminUser = newAdmin;
      }

      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          username: 'Admin',
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator'
        }
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
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
