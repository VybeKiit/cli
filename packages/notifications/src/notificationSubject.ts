const defaultNotificationSubject = 'Notification';

/**
 * Resolve the human-readable subject used by notification adapters.
 *
 * @param subject - Optional subject supplied by the caller.
 * @returns The caller subject when it is non-empty, otherwise the package default subject.
 * @example
 * const subject = resolveNotificationSubject(undefined);
 */
export const resolveNotificationSubject = (subject: string | undefined): string => {
  if (subject !== undefined && subject.length > 0) {
    return subject;
  }

  return defaultNotificationSubject;
};
