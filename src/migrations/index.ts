import * as migration_20260628_111643 from './20260628_111643';

export const migrations = [
  {
    up: migration_20260628_111643.up,
    down: migration_20260628_111643.down,
    name: '20260628_111643'
  },
];
