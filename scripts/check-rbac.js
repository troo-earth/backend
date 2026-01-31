const supabase = require('../src/config/supabase');

async function main() {
  try {
    console.log('Querying Supabase for RBAC tables...');

    const { data: roles, error: rolesErr } = await supabase.from('Roles').select('*');
    if (rolesErr) {
      console.error('Failed to fetch Roles:', rolesErr);
      process.exit(2);
    }

    const { data: perms, error: permsErr } = await supabase.from('Permissions').select('*');
    if (permsErr) {
      console.error('Failed to fetch Permissions:', permsErr);
      process.exit(2);
    }

    const { data: rps, error: rpsErr } = await supabase.from('RolePermissions').select('*');
    if (rpsErr) {
      console.error('Failed to fetch RolePermissions:', rpsErr);
      process.exit(2);
    }

    console.log('\nRoles:');
    for (const r of roles) {
      console.log(`- ${r.role_name} (${r.role_id})`);
    }

    console.log('\nPermissions:');
    for (const p of perms) {
      console.log(`- ${p.permission_key} (${p.permission_id})`);
    }

    // build maps
    const roleById = {};
    for (const r of roles) roleById[r.role_id] = r.role_name;
    const permById = {};
    for (const p of perms) permById[p.permission_id] = p.permission_key;

    const mapping = {};
    for (const rp of rps) {
      const roleName = roleById[rp.role_id] || rp.role_id;
      const permKey = permById[rp.permission_id] || rp.permission_id;
      mapping[roleName] = mapping[roleName] || new Set();
      mapping[roleName].add(permKey);
    }

    console.log('\nRole -> Permissions mapping:');
    for (const [roleName, set] of Object.entries(mapping)) {
      console.log(`- ${roleName}: ${Array.from(set).join(', ')}`);
    }

    // Check for required roles and permissions
    const requiredRoles = ['ADMIN', 'MANAGER', 'VIEWER'];
  const requiredPerms = ['BUY', 'SELL', 'RETIRE', 'TRANSFER', 'VIEW', 'USER_MANAGEMENT'];

    console.log('\nStatus checks:');

    for (const rr of requiredRoles) {
      const found = roles.some(r => r.role_name === rr);
      console.log(`Role ${rr}: ${found ? 'FOUND' : 'MISSING'}`);
    }

    for (const rp of requiredPerms) {
      const found = perms.some(p => p.permission_key === rp);
      console.log(`Permission ${rp}: ${found ? 'FOUND' : 'MISSING'}`);
    }

    console.log('\nRequired mappings (role -> expected perms):');
    const expected = {
  ADMIN: ['BUY','SELL','RETIRE','TRANSFER','VIEW','USER_MANAGEMENT'],
      MANAGER: ['BUY','SELL','RETIRE','TRANSFER','VIEW'],
      VIEWER: ['VIEW']
    };

    for (const [roleName, expPerms] of Object.entries(expected)) {
      const actualSet = mapping[roleName] ? mapping[roleName] : new Set();
      const missing = expPerms.filter(p => !actualSet.has(p));
      console.log(`${roleName}: ${missing.length === 0 ? 'OK' : 'MISSING: ' + missing.join(', ')}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err.message || err);
    process.exit(3);
  }
}

main();
