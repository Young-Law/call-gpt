const { listStaffMembers } = require('../../integrations/zoho/client');

async function listStaffMembersHandler() {
  return { status: 'success', staff_members: listStaffMembers() };
}

module.exports = { listStaffMembersHandler };
