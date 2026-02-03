const User = require('../modules/user/userModel');
const Role = require('../modules/rbac/roleModel');
const Org = require('../modules/org/orgModel');
const Permission = require('../modules/rbac/permissionModel');
const RolePermission = require('../modules/rbac/rolePermissionModel');
// Sequelize model representation for Invitations used by the invitations flow.
// Note: invitations are persisted in the local Postgres database via this model
// and are used by core operations (create/verify/consume/revoke) in inviteService.
// If the local DB doesn't have an Invitations table, Sequelize operations will fail
// until a migration creates it. Use with caution.
const Invitation = require('../modules/invitations/inviteModel');

// Define associations
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users',
});

User.belongsTo(Org, {
  foreignKey: 'org_id',
  as: 'organization',
});

Org.hasMany(User, {
  foreignKey: 'org_id',
  as: 'users',
});

// Role-Permission many-to-many through RolePermission
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

module.exports = {
  User,
  Role,
  Org,
  Permission,
  RolePermission,
  Invitation,
};