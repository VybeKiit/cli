import { type DataProvider, resolveDataProvider } from '@vybekiit/db';
import { type OrgMember, TenancyError, type TenancyProvider } from '@vybekiit/tenancy/types';
import { Effect } from 'effect';

/** Optional dependencies used to compose tenancy in tests or custom runtimes. */
export type ResolveTenancyInjections = {
  readonly dataProvider?: DataProvider;
};

type OrgRow = {
  readonly id: string;
  readonly name: string;
  readonly owner_user_id: string;
};

type MemberRow = {
  readonly id: string;
  readonly org_id: string;
  readonly user_id: string;
  readonly email: string;
  readonly role: string;
};

/**
 * Preserve a db failure's stable code/message as a {@link TenancyError}.
 *
 * @param error - Database failure to map.
 * @returns A tenancy failure with the same stable code and message.
 * @example
 * const failure = toTenancyError({ code: 'db_error', message: 'failed' });
 */
const toTenancyError = (error: { readonly code: string; readonly message: string }): TenancyError =>
  new TenancyError({ code: error.code, message: error.message });

/**
 * Resolve the data provider used by Better Auth tenancy.
 *
 * @param injections - Optional test or composition-root dependencies.
 * @returns The injected data provider, or the configured workspace data provider.
 * @example
 * const data = resolveTenancyDataProvider({ dataProvider });
 */
const resolveTenancyDataProvider = (injections: ResolveTenancyInjections): DataProvider => {
  if (injections.dataProvider !== undefined) {
    return injections.dataProvider;
  }
  return resolveDataProvider();
};

/**
 * Build tenancy over the configured data provider.
 *
 * @param injections - Optional dependencies for tests and custom composition roots.
 * @returns A provider backed by the organizations and organization_members tables.
 * @example
 * const tenancy = createBetterAuthTenancy({ dataProvider });
 */
export const createBetterAuthTenancy = (
  injections: ResolveTenancyInjections = {},
): TenancyProvider => {
  const data = resolveTenancyDataProvider(injections);
  return {
    name: 'better-auth',
    createOrg: (name, ownerUserId) => {
      const id = `org_${Date.now()}`;
      return data
        .insert<OrgRow>('organizations', { id, name, owner_user_id: ownerUserId })
        .pipe(Effect.as({ orgId: id }), Effect.mapError(toTenancyError));
    },
    inviteMember: (orgId, email, role = 'member') => {
      const id = `invite_${Date.now()}`;
      return data
        .insert<MemberRow>('organization_members', {
          id,
          org_id: orgId,
          user_id: id,
          email,
          role,
        })
        .pipe(Effect.as(true as const), Effect.mapError(toTenancyError));
    },
    listMembers: (orgId) =>
      data.query<MemberRow>('organization_members', { org_id: orgId }).pipe(
        Effect.map((rows) =>
          rows.map((row): OrgMember => ({ userId: row.user_id, email: row.email, role: row.role })),
        ),
        Effect.mapError(toTenancyError),
      ),
    removeMember: (orgId, userId) =>
      Effect.gen(function* () {
        const members = yield* data.query<MemberRow>('organization_members', {
          org_id: orgId,
          user_id: userId,
        });
        for (const member of members) {
          yield* data.remove('organization_members', member.id);
        }
        return true as const;
      }).pipe(Effect.mapError(toTenancyError)),
  };
};
