import { Either, Schema } from 'effect';
import { NextResponse } from 'next/server';

const contactSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  message: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(5000)),
});

const decodeContact = Schema.decodeUnknownEither(contactSchema);

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

  const parsed = decodeContact(body);
  if (Either.isLeft(parsed)) {
    return NextResponse.json(
      { error: 'Please fill in name, email, and message.' },
      { status: 400 },
    );
  }

  // TODO(vybekiit): forward to email provider — skill: setup-email
  return NextResponse.json({ ok: true });
}
