import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { departments } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const activeDepartments = await db
      .select({
        id: departments.id,
        name: departments.name,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);

    return NextResponse.json(activeDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
