const supabase = require('../../config/supabase');
const { sendEmail } = require('../emails/emailService');
const { inviteTemplate, inviteTextTemplate } = require('../emails/emailTemplates');

const INVITE_EXPIRY_HOURS = parseInt(process.env.INVITE_EXPIRY_HOURS || '168', 10); // default 7 days
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || '';

// Note: we no longer generate or store per-invite tokens. We use the
// invitation's UUID (invite_id) as the identifier sent to the recipient.

async function createInvitation({ email, org_id, invited_by_user_id, role_name }) {
  const normalizedRoleName = typeof role_name === 'string' ? role_name.toUpperCase() : role_name;
  // lookup role_id by role_name
  const { data: roles, error: roleErr } = await supabase
    .from('Roles')
    .select('*')
    .eq('role_name', normalizedRoleName)
    .limit(1);

  if (roleErr) throw new Error('Failed to lookup role');
  if (!roles || roles.length === 0) throw new Error('Unknown role');

  const role_id = roles[0].role_id;

  const expires_at = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('Invitations')
    .insert([
      {
        email,
        org_id,
        invited_by_user_id,
        role_id,
        expires_at,
        status: 'PENDING'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase Invitations insert error', error);
    throw new Error('Failed to create invitation');
  }

  // Send invite email (use centralized templates)
  const inviteId = data.invite_id;
  const joinUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/join-organization?invite_id=${inviteId}&org_id=${org_id}`;

  const html = inviteTemplate({ role_name, joinUrl, inviteId, org_id, expires_at });
  const text = inviteTextTemplate({ role_name, joinUrl, inviteId, org_id, expires_at });

  // In dev, log the generated email so we can verify content even if provider templates strip it
  if (process.env.NODE_ENV !== 'production') {
    console.log('Invite email HTML:', html);
    console.log('Invite email text:', text);
  }

  await sendEmail({ to: email, subject: 'Invitation to join troo.earth', html, text });

  return { invitation: data };
}

async function verifyAndConsumeInvitation({ invite_id, org_id, email }) {
  // Look up by invite_id and pending status. If org_id is provided (from URL), validate it matches.
  if (!invite_id) throw new Error('Missing invite identifier');

  let query = supabase.from('Invitations').select('*').eq('invite_id', invite_id).eq('status', 'PENDING').limit(1);
  if (org_id) query = query.eq('org_id', org_id);

  const { data, error } = await query.single();

  if (error) {
    // Could be no rows or actual error
    console.error('Supabase invitation lookup error', error);
    throw new Error('Invalid or expired invitation');
  }

  if (!data) throw new Error('Invalid or expired invitation');

  // check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('Invitation expired');
  }

  if (email && data.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Invitation email mismatch');
  }

  // Mark invitation as accepted - CRITICAL: must succeed to prevent reuse
  const { data: updatedInvite, error: updateErr } = await supabase
    .from('Invitations')
    .update({ 
      status: 'ACCEPTED', 
      updated_at: new Date().toISOString() 
    })
    .eq('invite_id', data.invite_id)
    .eq('status', 'PENDING')
    .select()
    .single();

  // If no row was updated (or an error occurred), treat as invalid/expired/already-used
  if (updateErr || !updatedInvite) {
    console.error('Failed to update invitation status (possibly already used or invalid)', updateErr);
    throw new Error('Invalid or expired invitation');
  }

  // Try to enrich with role_name
  let role_name = null;
  try {
    const { data: roles } = await supabase.from('Roles').select('role_name').eq('role_id', data.role_id).limit(1);
    if (roles && roles.length > 0) role_name = roles[0].role_name;
  } catch (e) {
    // ignore
  }

  return { ...data, role_name }; // contains role_id and invited_by_user_id and role_name
}

async function revokeInvitation({ invite_id, revoked_by }) {
  if (!invite_id) throw new Error('Missing invite_id');

  const { data, error } = await supabase
    .from('Invitations')
    .update({ 
      status: 'REVOKED', 
      revoked_by, 
      revoked_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    })
    .eq('invite_id', invite_id)
    .select()
    .single();

  if (error) {
    console.error('Failed to revoke invitation', error);
    throw new Error('Failed to revoke invitation');
  }

  return data;
}

module.exports = { createInvitation, verifyAndConsumeInvitation, revokeInvitation };
