// app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { roles, users } from '@/lib/database/schema';
import { eq, count, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch all roles with user counts
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

    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        isDefault: roles.isDefault,
        createdAt: roles.createdAt,
        userCount: count(users.id),
      })
      .from(roles)
      .leftJoin(users, eq(users.role, roles.name))
      .groupBy(roles.id, roles.name, roles.description, roles.permissions, roles.isDefault, roles.createdAt)
      .orderBy(roles.createdAt);

    return NextResponse.json({
      success: true,
      roles: rolesList,
    });
  } catch (error) {
    console.error('Roles GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, permissions } = await request.json();

    // Validate required fields
    if (!name || !description || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create role
    const [role] = await db
      .insert(roles)
      .values({
        name,
        description,
        permissions,
        isDefault: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role,
    });
  } catch (error) {
    console.error('Role POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
