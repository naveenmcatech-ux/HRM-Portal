// app/api/admin/settings/holidays/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { holidays } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// PUT - Update holiday
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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, date, type, description } = await request.json();
    const holidayId = params.id;

    // Check if holiday exists
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, holidayId))
      .limit(1);

    if (existingHoliday.length === 0) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }

    // Check if date conflicts with other holidays
    if (date && new Date(date).toDateString() !== existingHoliday[0].date.toDateString()) {
      const conflictingHoliday = await db
        .select()
        .from(holidays)
        .where(eq(holidays.date, new Date(date)))
        .limit(1);

      if (conflictingHoliday.length > 0) {
        return NextResponse.json(
          { error: 'Another holiday already exists on this date' },
          { status: 400 }
        );
      }
    }

    // Update holiday
    const [updatedHoliday] = await db
      .update(holidays)
      .set({
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      })
      .where(eq(holidays.id, holidayId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Holiday updated successfully',
      holiday: updatedHoliday,
    });
  } catch (error) {
    console.error('Holiday PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete holiday
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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const holidayId = params.id;

    // Check if holiday exists
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, holidayId))
      .limit(1);

    if (existingHoliday.length === 0) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }

    // Delete holiday
    await db
      .delete(holidays)
      .where(eq(holidays.id, holidayId));

    return NextResponse.json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    console.error('Holiday DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}