import { Either, Schema } from 'effect';
import { NextResponse } from 'next/server';

/** Basic email shape — e.g. `you@example.com`; rejects `you@` or missing domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  email: Schema.String.pipe(Schema.pattern(EMAIL_PATTERN)),
  message: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(5000)),
});

const decodeContact = Schema.decodeUnknownEither(contactSchema);

/**
 * Handle public contact form submissions.
 *
 * @param request - Incoming contact form request.
 * @returns JSON response that accepts valid contact form payloads.
 * @example
 * const response = await POST(request);
 */
export const POST = async (request: Request): Promise<NextResponse> => {
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
};
