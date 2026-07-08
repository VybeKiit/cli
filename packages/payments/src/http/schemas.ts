import { Schema } from 'effect';

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

/** Request body accepted by the checkout HTTP handler. */
export const CheckoutBodySchema = Schema.Struct({
  productId: NonEmpty,
  githubUsername: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
});

/** Request body accepted by the practice checkout completion handler. */
export const PracticeCompleteBodySchema = Schema.Struct({
  productId: NonEmpty,
});

/** Static type inferred from {@link CheckoutBodySchema}. */
export type CheckoutBody = typeof CheckoutBodySchema.Type;

/** Static type inferred from {@link PracticeCompleteBodySchema}. */
export type PracticeCompleteBody = typeof PracticeCompleteBodySchema.Type;
