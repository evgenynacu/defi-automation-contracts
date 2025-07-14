import { NextResponse } from 'next/server';
import { API_BASE_URL, REVALIDATE_INTERVAL } from '@/lib/env';

export async function GET() {
  try {
    // Create URL based on environment variables
    const apiUrl = `${API_BASE_URL}/api/strategies`;

    // Try to fetch data from the main API
    const response = await fetch(apiUrl, {
      next: { revalidate: REVALIDATE_INTERVAL }
    });

    if (!response.ok) {
      console.error('Error fetching from main API:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch strategies' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from main API:', error);
    // Return error status in case of failure
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}