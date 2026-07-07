import { Schema } from 'effect';

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

// "hello@example.com" matches, "hello" does not.
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailField = Schema.String.pipe(
  Schema.filter((value) => EMAIL_ADDRESS_PATTERN.test(value), {
    message: () => 'must be a valid email',
  }),
);

export const SignUpBodySchema = Schema.Struct({
  email: EmailField,
  password: NonEmpty,
});

export const SignInBodySchema = Schema.Struct({
  email: EmailField,
  password: NonEmpty,
});

export const EmailOnlyBodySchema = Schema.Struct({
  email: EmailField,
});

export const EmailCodeBodySchema = Schema.Struct({
  email: EmailField,
  code: NonEmpty,
});

export const ResetPasswordBodySchema = Schema.Struct({
  token: NonEmpty,
  newPassword: NonEmpty,
});

export const TokenOnlyBodySchema = Schema.Struct({
  token: NonEmpty,
});

export const PhoneOnlyBodySchema = Schema.Struct({
  phone: NonEmpty,
});

export const PhoneCodeBodySchema = Schema.Struct({
  phone: NonEmpty,
  code: NonEmpty,
});

export type SignUpBody = typeof SignUpBodySchema.Type;
export type SignInBody = typeof SignInBodySchema.Type;
export type EmailOnlyBody = typeof EmailOnlyBodySchema.Type;
export type EmailCodeBody = typeof EmailCodeBodySchema.Type;
export type ResetPasswordBody = typeof ResetPasswordBodySchema.Type;
export type TokenOnlyBody = typeof TokenOnlyBodySchema.Type;
export type PhoneOnlyBody = typeof PhoneOnlyBodySchema.Type;
export type PhoneCodeBody = typeof PhoneCodeBodySchema.Type;
