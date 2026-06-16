import { createAccessControl } from 'better-auth/plugins/access';

export const ac = createAccessControl({
  residence: ['create', 'read', 'update', 'delete'],
  apartment: ['create', 'read', 'update', 'delete'],
  payment: ['create', 'read', 'update', 'delete'],
  complaint: ['create', 'read', 'update', 'delete'],
  meeting: ['create', 'read', 'update', 'delete'],
  feed_post: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
});

export const organizationRoles = {
  admin: ac.newRole({
    residence: ['create', 'read', 'update', 'delete'],
    apartment: ['create', 'read', 'update', 'delete'],
    payment: ['create', 'read', 'update', 'delete'],
    complaint: ['create', 'read', 'update', 'delete'],
    meeting: ['create', 'read', 'update', 'delete'],
    feed_post: ['create', 'read', 'update', 'delete'],
    document: ['create', 'read', 'update', 'delete'],
  }),
  syndic: ac.newRole({
    residence: ['read', 'update'],
    apartment: ['create', 'read', 'update', 'delete'],
    payment: ['create', 'read', 'update', 'delete'],
    complaint: ['create', 'read', 'update', 'delete'],
    meeting: ['create', 'read', 'update', 'delete'],
    feed_post: ['create', 'read', 'update', 'delete'],
    document: ['create', 'read', 'update', 'delete'],
  }),
  owner: ac.newRole({
    residence: ['read'],
    apartment: ['read'],
    payment: ['create', 'read'],
    complaint: ['create', 'read', 'update'],
    meeting: ['read'],
    feed_post: ['create', 'read'],
    document: ['read'],
  }),
  tenant: ac.newRole({
    residence: ['read'],
    apartment: ['read'],
    payment: ['create', 'read'],
    complaint: ['create', 'read', 'update'],
    meeting: ['read'],
    feed_post: ['create', 'read'],
    document: ['read'],
  }),
  staff: ac.newRole({
    residence: ['read'],
    apartment: ['read'],
    payment: ['read'],
    complaint: ['read', 'update'],
    meeting: [],
    feed_post: ['read'],
    document: ['read'],
  }),
};
