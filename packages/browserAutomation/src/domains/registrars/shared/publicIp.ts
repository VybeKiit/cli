/**
 * Fetches the machine's public IPv4 for Namecheap API whitelist.
 *
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await fetchPublicIpv4();
 */
export const fetchPublicIpv4 = async (): Promise<string> => {
  const response = await fetch('https://api.ipify.org?format=json');
  if (!response.ok) {
    throw new Error(`Could not detect public IP (HTTP ${response.status})`);
  }
  const data = (await response.json()) as { ip?: string };
  const ip = data.ip?.trim();
  if (!(ip && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip))) {
    throw new Error('Could not parse public IPv4 from ipify response');
  }
  return ip;
};
