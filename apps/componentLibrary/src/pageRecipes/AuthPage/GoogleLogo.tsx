import type { SVGProps } from 'react';

/** Official-colored Google "G" mark for the OAuth button. */
export const GoogleLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
    <path
      d="M21.6 12.23c0-.73-.07-1.43-.19-2.1H12v3.98h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.89-1.74 2.99-4.3 2.99-7.4Z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.22-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
      fill="#34A853"
    />
    <path
      d="M6.41 13.89A6.01 6.01 0 0 1 6.1 12c0-.66.11-1.3.31-1.89V7.53H3.08A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.33-2.58Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.96 3 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.53l3.33 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
      fill="#EA4335"
    />
  </svg>
);
