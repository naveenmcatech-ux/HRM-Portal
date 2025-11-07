import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/auth/utils';


export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Default admin credentials
    if (username === 'Admin' && password === 'Admin123') {
      // Check if admin user exists, if not create it
      const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.username, 'Admin'))
        .limit(1);

      if (existingAdmin.length === 0) {
        // Create admin user
        await db.insert(users).values({
          username: 'Admin',
          email: 'admin@hrms.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin',
          isActive: true,
        });
      }

      // In a real app, you'd use proper authentication
      // For now, we'll create a session
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
    
    // For other users, try to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Assuming username is email for non-admin
        password,
    });

    if (error || !data.user) {
        return NextResponse.json(
            { success: false, message: error?.message || 'Invalid credentials' },
            { status: 401 }
        );
    }

    const userData = await db.select().from(users).where(eq(users.authId, data.user.id)).limit(1);
    
    if (userData.length === 0) {
        return NextResponse.json(
            { success: false, message: 'User not found in application database.' },
            { status: 404 }
        );
    }

    const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: userData[0]
    });
    
    // Set cookies from Supabase session
    const session = data.session;
    if (session) {
        response.cookies.set(
            `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`,
             JSON.stringify([session.access_token, session.refresh_token]), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: session.expires_in
        });
    }

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
