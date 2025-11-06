import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { departments } from '@/lib/database/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allDepartments = await db
        .select({
            id: departments.id,
            name: departments.name
        })
        .from(departments)
        .where(departments.isActive)
        .orderBy(asc(departments.name));

    return NextResponse.json({ departments: allDepartments });
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
