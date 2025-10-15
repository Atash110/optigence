import { NextRequest, NextResponse } from 'next/server';
import smartCalendar from '@/lib/optimail/calendar-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 10)) : 10;

    const events = await smartCalendar.getUpcomingEvents(limit);
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Calendar upcoming events error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch upcoming events' }, { status: 500 });
  }
}
