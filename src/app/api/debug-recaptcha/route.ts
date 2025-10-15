import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  return NextResponse.json({
    siteKeyExists: !!siteKey,
    secretKeyExists: !!secretKey,
    siteKeyLength: siteKey?.length || 0,
    secretKeyLength: secretKey?.length || 0,
    environment: process.env.NODE_ENV
  });
}
