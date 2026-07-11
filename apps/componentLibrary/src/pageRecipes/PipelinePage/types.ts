export type StageId = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won';

/** One pipeline deal card. Value is integer cents (mirrors deals.value_cents). */
export type Deal = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly owner: string;
  readonly valueCents: number;
  readonly stage: StageId;
  readonly closeDate: string;
};
