export const Permission = {
  ASSETS_CREATE: 'assets:create',
  ASSETS_READ: 'assets:read',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_DELETE: 'assets:delete',
  CLASSIFIERS_CREATE: 'classifiers:create',
  CLASSIFIERS_READ: 'classifiers:read',
  CLASSIFIERS_UPDATE: 'classifiers:update',
  CLASSIFIERS_DELETE: 'classifiers:delete',
  COLLECTIONS_CREATE: 'collections:create',
  COLLECTIONS_READ: 'collections:read',
  COLLECTIONS_UPDATE: 'collections:update',
  COLLECTIONS_DELETE: 'collections:delete',
  PLUGINS_READ: 'plugins:read',
  PLUGINS_UPDATE: 'plugins:update',
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  SEARCH_INDEXES_CREATE: 'search-indexes:create',
  SEARCH_INDEXES_READ: 'search-indexes:read',
  SEARCH_INDEXES_DELETE: 'search-indexes:delete',
  STORAGE_UNITS_CREATE: 'storage-units:create',
  STORAGE_UNITS_READ: 'storage-units:read',
  STORAGE_UNITS_UPDATE: 'storage-units:update',
  STORAGE_UNITS_DELETE: 'storage-units:delete',
  SUPER: 'super',
  SYSTEM_SETTINGS_UPDATE: 'system-settings:update',
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const MANAGER = {
  [Permission.ASSETS_CREATE]: true,
  [Permission.ASSETS_READ]: true,
  [Permission.ASSETS_UPDATE]: true,
  [Permission.ASSETS_DELETE]: true,
  [Permission.CLASSIFIERS_READ]: true,
  [Permission.COLLECTIONS_CREATE]: true,
  [Permission.COLLECTIONS_READ]: true,
  [Permission.COLLECTIONS_UPDATE]: true,
  [Permission.COLLECTIONS_DELETE]: true,
  [Permission.STORAGE_UNITS_READ]: true,
} as const;

const ADMIN = {
  ...MANAGER,
  [Permission.CLASSIFIERS_CREATE]: true,
  [Permission.CLASSIFIERS_UPDATE]: true,
  [Permission.CLASSIFIERS_DELETE]: true,
  [Permission.PLUGINS_READ]: true,
  [Permission.PLUGINS_UPDATE]: true,
  [Permission.ROLES_CREATE]: true,
  [Permission.ROLES_READ]: true,
  [Permission.ROLES_UPDATE]: true,
  [Permission.ROLES_DELETE]: true,
  [Permission.SEARCH_INDEXES_CREATE]: true,
  [Permission.SEARCH_INDEXES_READ]: true,
  [Permission.SEARCH_INDEXES_DELETE]: true,
  [Permission.STORAGE_UNITS_CREATE]: true,
  [Permission.STORAGE_UNITS_READ]: true,
  [Permission.STORAGE_UNITS_UPDATE]: true,
  [Permission.STORAGE_UNITS_DELETE]: true,
  [Permission.SYSTEM_SETTINGS_UPDATE]: true,
  [Permission.USERS_CREATE]: true,
  [Permission.USERS_READ]: true,
  [Permission.USERS_UPDATE]: true,
  [Permission.USERS_DELETE]: true,
} as const;

const SUPER_ADMIN = {
  [Permission.SUPER]: true,
} as const;

export const DEFAULT_ROLES = {
  manager: {
    name: 'Manager',
    description: 'Standard asset management',
    permissions: MANAGER,
  },
  admin: {
    name: 'Admin',
    description: 'Administrator capable of most actions',
    permissions: ADMIN,
  },
  superAdmin: {
    name: 'Super Admin',
    description: 'Administrator with all privileges',
    permissions: SUPER_ADMIN,
  },
} as const;
