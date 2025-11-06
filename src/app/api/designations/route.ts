import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { designations } from '@/lib/database/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allDesignations = await db
        .select({
            id: designations.id,
            name: designations.name
        })
        .from(designations)
        .where(designations.isActive)
        .orderBy(asc(designations.name));

    return NextResponse.json({ designations: allDesignations });
  } catch (error) {
    console.error('Failed to fetch designations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
