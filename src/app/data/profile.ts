export interface Profile {
  initials: string;
  name: string;
  handle: string;
  fanSince: number;
  teamId: string;
  level: number;
  xp: number;
  xpMax: number;
  clips: number;
  trophies: number;
  cards: number;
}

export const PROFILE: Profile = {
  initials: 'SM',
  name: 'Juan Pérez',
  handle: '@foopball_fan',
  fanSince: 2024,
  teamId: 'nyy',
  level: 7,
  xp: 2480,
  xpMax: 3000,
  clips: 24,
  trophies: 9,
  cards: 60,
};

export interface AccountRow {
  id: string;
  label: string;
  value: string;
  danger?: boolean;
}

export const ACCOUNT_ROWS: AccountRow[] = [
  { id: 'team', label: 'Favorite team', value: 'New York Yankees' },
  { id: 'quality', label: 'AR quality', value: 'High' },
  { id: 'notifications', label: 'Notifications', value: 'On' },
  { id: 'signout', label: 'Sign out', value: '', danger: true },
];
