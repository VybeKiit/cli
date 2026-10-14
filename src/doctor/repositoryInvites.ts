import type { ExecFn } from '../global/exec';

const pendingInviteIds = async (gh: ExecFn, org: string): Promise<string[]> => {
  const ownerLogin = org.toLowerCase();
  const inviteList = await gh([
    'api',
    'user/repository_invitations',
    '--paginate',
    '--jq',
    `.[] | select(.repository.owner.login | ascii_downcase == "${ownerLogin}") | .id`,
  ]);
  if (inviteList.code !== 0) {
    return [];
  }
  return inviteList.stdout
    .split('\n')
    .map((inviteLine) => inviteLine.trim())
    .filter(Boolean);
};

export const acceptRepositoryInvites = async (gh: ExecFn, org: string): Promise<number> => {
  const inviteIds = await pendingInviteIds(gh, org);
  const acceptances = await Promise.all(
    inviteIds.map((inviteId) =>
      gh(['api', '-X', 'PATCH', `user/repository_invitations/${inviteId}`, '--silent']),
    ),
  );
  return acceptances.filter((acceptance) => acceptance.code === 0).length;
};
