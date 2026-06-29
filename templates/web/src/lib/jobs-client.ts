import { resolveJobsProvider } from '@vybekiit/jobs';

/** Background jobs wire point */
export function getJobs() {
  return resolveJobsProvider();
}
