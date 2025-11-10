// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { systemSettings } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await db
      .select()
      .from(systemSettings)
      .limit(1);

    // If no settings exist, return default settings
    if (settings.length === 0) {
      const defaultSettings = getDefaultSettings();
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    return NextResponse.json({
      success: true,
      settings: settings[0].settings,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await request.json();

    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(systemSettings)
      .limit(1);

    let result;

    if (existingSettings.length > 0) {
      // Update existing settings
      [result] = await db
        .update(systemSettings)
        .set({
          settings,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.id, existingSettings[0].id))
        .returning();
    } else {
      // Create new settings
      [result] = await db
        .insert(systemSettings)
        .values({
          settings,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: result.settings,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultSettings() {
  return {
    company: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      logo: '',
      taxId: '',
    },
    attendance: {
      workHours: 8,
      overtimeRate: 1.5,
      gracePeriod: 15,
      autoCheckout: true,
      checkInStart: '08:00',
      checkInEnd: '10:00',
      checkOutStart: '17:00',
      checkOutEnd: '19:00',
    },
    leave: {
      sickLeave: 12,
      casualLeave: 8,
      earnedLeave: 21,
      maternityLeave: 180,
      paternityLeave: 15,
      carryForward: true,
      maxCarryForward: 30,
    },
    payroll: {
      currency: 'USD',
      payday: 25,
      taxPercentage: 15,
      pfPercentage: 12,
      bonusEligibility: 90,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      leaveApproval: true,
      payrollProcessed: true,
      attendanceAlerts: true,
      systemUpdates: true,
    },
    security: {
      sessionTimeout: 60,
      passwordExpiry: 90,
      twoFactorAuth: false,
      loginAttempts: 5,
      ipWhitelist: [],
    },
  };
}