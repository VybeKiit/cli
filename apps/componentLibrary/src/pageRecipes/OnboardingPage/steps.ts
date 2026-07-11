export const STEPS = [
  { id: 1, title: 'Workspace', hint: 'Name your app and claim its URL.' },
  { id: 2, title: 'Brand', hint: 'Pick a look and what you are building.' },
  { id: 3, title: 'Team', hint: 'Invite teammates now or skip for later.' },
  { id: 4, title: 'Review', hint: 'Confirm everything, then finish setup.' },
] as const;

export const TOTAL_STEPS = STEPS.length;

/** Where a step sits relative to the one you're on — drives the stepper's dot styling. */
export const stepStatus = (id: number, current: number): 'done' | 'current' | 'todo' => {
  if (id < current) {
    return 'done';
  }
  if (id === current) {
    return 'current';
  }
  return 'todo';
};
