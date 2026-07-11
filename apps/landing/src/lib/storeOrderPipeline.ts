import {
  type AccessGate,
  createRestAccessGate,
  githubGateConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { mapOrderEventToLedgerRow, type OrderEvent } from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { recordOrderBestEffort } from '@/lib/orders';
import type { PriceLadderSnapshot } from '@/lib/priceLadder';
import { applyPaidSaleToLadder, type PriceLadderApplyResult } from '@/lib/priceLadderStore';

/** Outcome of the store money pipeline for one verified payment event. */
export type StoreFulfillmentResult = {
  readonly recorded: boolean;
  readonly ladderBumped: boolean;
  readonly ladder: PriceLadderSnapshot | null;
  readonly gated: boolean;
  readonly action: 'invited' | 'removed' | 'skipped';
};

/** Dependencies the pipeline injects so tests can swap ledgers/gates. */
export type StoreOrderPipelineDeps = {
  readonly recordOrder?: (row: {
    readonly orderId: string;
    readonly email: string | null;
    readonly customerName: string | null;
    readonly githubUsername: string | null;
    readonly refunded: boolean;
  }) => Promise<boolean>;
  readonly applyLadder?: (orderId: string) => Promise<
    | PriceLadderApplyResult
    | {
        readonly bumped: boolean;
        readonly snapshot: PriceLadderSnapshot | null;
      }
  >;
  readonly accessGate?: AccessGate;
};

/**
 * Process one verified store payment event: ledger → ladder → access gate.
 *
 * Deep module for the keystone sale (CONTEXT.md money pipeline). The webhook
 * route is only a composition root: parse body → run this → HTTP + analytics.
 *
 * Steps:
 * 1. Map OrderEvent → ledger row and best-effort D1 write (never blocks the gate).
 * 2. Paid sales bump the rising ladder; refunds skip the bump.
 * 3. Missing githubUsername → ungated exit (money cleared, no account to invite).
 * 4. Else grant (paid) or revoke (refund) via AccessGate.
 *
 * @param event - Normalized OrderEvent from the payment provider.
 * @param deps - Optional overrides for ledger, ladder, and gate.
 * @returns Effect with structured fulfillment result or AccessGate/config failure.
 * @example
 * const result = await Effect.runPromise(processStorePaymentEvent(event));
 */
export const processStorePaymentEvent = (
  event: OrderEvent,
  deps: StoreOrderPipelineDeps = {},
): Effect.Effect<StoreFulfillmentResult, { readonly message: string }> =>
  Effect.gen(function* () {
    const row = mapOrderEventToLedgerRow(event);
    const recordOrder = deps.recordOrder ?? recordOrderBestEffort;
    const recorded = yield* Effect.promise(async () =>
      recordOrder({
        orderId: row.orderId,
        email: row.email,
        customerName: row.customerName,
        githubUsername: row.githubUsername,
        refunded: row.refunded,
      }),
    );

    const applyLadder =
      deps.applyLadder ??
      (async (orderId: string) => {
        if (event.isRefund) {
          return { bumped: false, snapshot: null as PriceLadderSnapshot | null };
        }
        return applyPaidSaleToLadder(orderId);
      });
    const ladder = yield* Effect.promise(async () => applyLadder(event.orderId));

    if (!event.githubUsername) {
      return {
        recorded,
        ladderBumped: ladder.bumped,
        ladder: ladder.snapshot,
        gated: false,
        action: 'skipped' as const,
      };
    }

    const gate = deps.accessGate ?? createRestAccessGate(parseEnv(githubGateConfigSchema));
    const gateProgram = event.isRefund
      ? gate.revoke(event.githubUsername)
      : gate.grant(event.githubUsername);
    const gateResult = yield* Effect.either(gateProgram);
    if (Either.isLeft(gateResult)) {
      return yield* Effect.fail({ message: gateResult.left.message });
    }

    return {
      recorded,
      ladderBumped: ladder.bumped,
      ladder: ladder.snapshot,
      gated: true,
      action: event.isRefund ? ('removed' as const) : ('invited' as const),
    };
  });
