import { Data, type Effect } from 'effect';

export type TenancyProviderName = 'better-auth' | 'local';

export interface OrgMember {
  readonly userId: string;
  readonly email?: string | undefined;
  readonly role: string;
}

/** The tagged failure a {@link TenancyProvider} method can produce (ADR-0023). */
export class TenancyError extends Data.TaggedError('TenancyError')<{
  readonly code: string;
  readonly message: string;
}> {}

export interface TenancyProvider {
  readonly name: TenancyProviderName;
  createOrg(name: string, ownerUserId: string): Effect.Effect<{ orgId: string }, TenancyError>;
  inviteMember(
    orgId: string,
    email: string,
    role?: string | undefined,
  ): Effect.Effect<true, TenancyError>;
  listMembers(orgId: string): Effect.Effect<readonly OrgMember[], TenancyError>;
  removeMember(orgId: string, userId: string): Effect.Effect<true, TenancyError>;
}
