import { NextRequest, NextResponse } from 'next/server';

// Adapter route: maps OptiMail client request shape to existing LLM draft API
// and returns the simplified structure expected by the frontend.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const input: string = body?.input || '';
    const userMemory: { tone?: string; language?: string; signature?: string } = body?.userMemory || {};

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // Build payload for the internal LLM draft endpoint
    const llmPayload = {
      intent: 'compose',
      transcriptOrText: input,
      extraction: {
        ask: input,
        topics: [],
      },
      slots: [],
      userProfile: {
        tone: userMemory.tone || 'professional',
        language: userMemory.language || 'en',
        signature: userMemory.signature,
      },
      contactProfile: {},
    };

    const origin = new URL(request.url).origin;
    const llmRes = await fetch(`${origin}/api/llm/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(llmPayload),
    });

    if (!llmRes.ok) {
      // Graceful fallback
      const primary = `Subject: Quick follow-up\n\nHi,\n\nI wanted to follow up on this. Please let me know if you have any questions.\n\nBest regards`;
      return NextResponse.json({
        primary,
        alternatives: [],
        intent: { intent: 'compose' },
      });
    }

    const llmData = await llmRes.json().catch(() => ({}));
    const primaryDraft = llmData?.primary_draft || {};
    const alternativesArr: Array<any> = Array.isArray(llmData?.alternatives) ? llmData.alternatives : [];

    const primary = `Subject: ${primaryDraft.subject || 'Quick follow-up'}\n\n${primaryDraft.body || ''}`.trim();
    const alternatives: string[] = alternativesArr
      .map((alt) => `Subject: ${alt?.subject || ''}\n\n${alt?.body || ''}`.trim())
      .filter((s) => s.length > 0);

    return NextResponse.json({
      primary,
      alternatives,
      intent: { intent: llmData?.metadata?.intent || 'compose' },
    });
  } catch (error) {
    // Final fallback to avoid breaking the client
    const primary = `Subject: Quick follow-up\n\nHi,\n\nI wanted to follow up on this. Please let me know if you have any questions.\n\nBest regards`;
    return NextResponse.json({
      primary,
      alternatives: [],
      intent: { intent: 'compose' },
    });
  }
}


