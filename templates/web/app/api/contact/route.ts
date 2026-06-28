import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

/**
 * Public contact form — lenient rate-limit tier (`public-form`), not auth-strict.
 * The agent wires email delivery via `setup-email`; until then this accepts and logs.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please fill in name, email, and message.' },
      { status: 400 },
    );
  }

  // TODO(vybekiit): forward to email provider — skill: setup-email
  return NextResponse.json({ ok: true });
}
