const { listStaffMembers } = require('./zoho_crm');

async function listStaffMembersHandler() {
  const staffMembers = listStaffMembers();

  return {
    status: 'success',
    staff_members: staffMembers,
  };
}

module.exports = listStaffMembersHandler;
