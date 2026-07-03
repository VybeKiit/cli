import { Schema } from 'effect';

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

export const CheckoutBodySchema = Schema.Struct({
  productId: NonEmpty,
  githubUsername: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
});

export const PracticeCompleteBodySchema = Schema.Struct({
  productId: NonEmpty,
});

export type CheckoutBody = typeof CheckoutBodySchema.Type;
export type PracticeCompleteBody = typeof PracticeCompleteBodySchema.Type;
