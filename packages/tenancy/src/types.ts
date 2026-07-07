import { Data, type Effect, Schema } from 'effect';

/** Provider keys supported by the tenancy resolver. */
export const TenancyProviderName = Schema.Literal('better-auth', 'local');

/** A member listed inside an organization or workspace. */
export const OrgMember = Schema.Struct({
  userId: Schema.String,
  email: Schema.optional(Schema.String),
  role: Schema.String,
});

/** Static type inferred from {@link TenancyProviderName}. */
export type TenancyProviderNameType = Schema.Schema.Type<typeof TenancyProviderName>;

/** Static type inferred from {@link OrgMember}. */
export type OrgMemberType = Schema.Schema.Type<typeof OrgMember>;

/** Provider keys supported by the tenancy resolver. */
export type TenancyProviderName = TenancyProviderNameType;

/** A member listed inside an organization or workspace. */
export type OrgMember = OrgMemberType;

/** Stable resolver failure codes owned by the tenancy package. */
export type TenancyResolverErrorCode = 'TENANCY_CONFIG_INVALID' | 'TENANCY_PROVIDER_UNSUPPORTED';

/** The tagged failure a {@link TenancyProvider} method can produce (ADR-0023). */
export class TenancyError extends Data.TaggedError('TenancyError')<{
  readonly code: string;
  readonly message: string;
}> {}

/** Organization and membership operations used by team-enabled templates. */
export type TenancyService = {
  readonly name: TenancyProviderName;
  /** Create an organization owned by a user. */
  readonly createOrg: (
    name: string,
    ownerUserId: string,
  ) => Effect.Effect<{ orgId: string }, TenancyError>;
  /** Invite or add a member to an organization. */
  readonly inviteMember: (
    orgId: string,
    email: string,
    role?: string | undefined,
  ) => Effect.Effect<true, TenancyError>;
  /** List members currently attached to an organization. */
  readonly listMembers: (orgId: string) => Effect.Effect<readonly OrgMember[], TenancyError>;
  /** Remove a user from an organization. */
  readonly removeMember: (orgId: string, userId: string) => Effect.Effect<true, TenancyError>;
};

/** Backward-compatible alias for the tenancy service contract. */
export type TenancyProvider = TenancyService;
