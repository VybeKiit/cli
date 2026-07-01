import { makeResultLifter } from '@vybekiit/core';
import { PaymentError } from './types';

/**
 * Lift `Result`-returning adapter bodies into the `Effect` the {@link PaymentProvider}
 * interface returns (ADR-0023), binding the shared core lifter to {@link PaymentError}.
 * The lifting logic is the SSOT in `@vybekiit/core`; this file only binds the error.
 * Both this seam and `Result` retire in Slice 8.
 */
export const { fromResult, fromResultPromise } = makeResultLifter(
  (failure) => new PaymentError(failure),
);
