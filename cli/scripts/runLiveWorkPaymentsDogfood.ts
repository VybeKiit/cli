/**
 * One-shot dogfood for live-work payments (reads process.env).
 * Usage: pnpm exec tsx scripts/runLiveWorkPaymentsDogfood.ts  (from cli/)
 */
import { runLiveWorkPayments } from '../src/commands/liveWorkPaymentsCmd';

const main = async (): Promise<void> => {
  const result = await runLiveWorkPayments(['--mode=demo', '--no-pin', '--fresh']);
  process.stdout.write(`${result.json}\n`);
  process.exitCode = result.exitCode;
};

void main();
