const supabase = require('../src/config/supabase');

async function upsert(table, row, uniqueCols) {
  // Try to find an existing row by uniqueCols
  let query = supabase.from(table).select('*');
  for (const col of uniqueCols) {
    query = query.eq(col, row[col]);
  }
  const { data } = await query.limit(1).maybeSingle();
  if (data) return data;

  const { data: insertData, error } = await supabase.from(table).insert([row]).select().single();
  if (error) throw error;
  return insertData;
}

async function seed() {
  console.log('Seeding Roles and Permissions in Supabase...');

  // Roles
  const rolesToEnsure = [
    { role_name: 'ADMIN', description: 'Organization administrator' },
    { role_name: 'MANAGER', description: 'Can manage listings and invite viewers' },
    { role_name: 'VIEWER', description: 'Read-only access' },
  ];

  const savedRoles = {};
  for (const r of rolesToEnsure) {
    const row = await upsert('Roles', r, ['role_name']);
    savedRoles[r.role_name] = row;
    console.log('Ensured role:', r.role_name);
  }

  // Permissions
  const perms = ['BUY', 'SELL', 'RETIRE', 'TRANSFER', 'VIEW', 'USER_MANAGEMENT'];
  const savedPerms = {};
  for (const p of perms) {
    const row = await upsert('Permissions', { permission_key: p, description: `${p} permission` }, ['permission_key']);
    savedPerms[p] = row;
    console.log('Ensured permission:', p);
  }

  // RolePermissions mapping
  const mappings = [
  { role: 'ADMIN', perms: ['BUY', 'SELL', 'RETIRE', 'TRANSFER', 'VIEW', 'USER_MANAGEMENT'] },
    { role: 'MANAGER', perms: ['BUY', 'SELL', 'RETIRE', 'TRANSFER', 'VIEW'] },
    { role: 'VIEWER', perms: ['VIEW'] },
  ];

  for (const m of mappings) {
    const role = savedRoles[m.role];
    for (const p of m.perms) {
      const perm = savedPerms[p];
      // upsert RolePermissions by role_id & permission_id unique constraint
      const { data: existing } = await supabase.from('RolePermissions').select('*').eq('role_id', role.role_id).eq('permission_id', perm.permission_id).limit(1).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('RolePermissions').insert([{ role_id: role.role_id, permission_id: perm.permission_id }]);
        if (error) throw error;
        console.log(`Assigned permission ${p} to role ${m.role}`);
      }
    }
  }

  console.log('RBAC seeding complete');
}

seed().catch((err) => {
  console.error('Seeding failed', err.message || err);
  process.exit(1);
});
