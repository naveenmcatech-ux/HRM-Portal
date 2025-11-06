import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { designations } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
  }

  try {
    const activeDesignations = await db
      .select({
        id: designations.id,
        name: designations.name,
      })
      .from(designations)
      .where(eq(designations.departmentId, departmentId))
      .orderBy(designations.name);

    return NextResponse.json(activeDesignations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
