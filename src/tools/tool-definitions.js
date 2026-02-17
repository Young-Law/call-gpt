const { schedulingTools } = require('./metadata/scheduling');
const { createCrmLeadAndEvent } = require('./handlers/createCrmLeadAndEvent');
const { checkAvailability } = require('./handlers/checkAvailability');
const { listAppointmentTypesHandler } = require('./handlers/listAppointmentTypes');
const { listStaffMembersHandler } = require('./handlers/listStaffMembers');

const tools = [...schedulingTools];

const toolHandlers = {
  createCrmLeadAndEvent,
  checkAvailability,
  listAppointmentTypes: listAppointmentTypesHandler,
  listStaffMembers: listStaffMembersHandler,
};

module.exports = { tools, toolHandlers };
