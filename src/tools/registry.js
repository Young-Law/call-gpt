const handlerLoaders = {
  createCrmLeadAndEvent: () => require('./handlers/createCrmLeadAndEvent').createCrmLeadAndEvent,
  checkAvailability: () => require('./handlers/checkAvailability').checkAvailability,
  listAppointmentTypes: () => require('./handlers/listAppointmentTypes').listAppointmentTypesHandler,
  listStaffMembers: () => require('./handlers/listStaffMembers').listStaffMembersHandler,
};

function getToolHandler(name) {
  const load = handlerLoaders[name];
  if (!load) {
    throw new Error(`No tool handler registered for tool: ${name}`);
  }

  const handler = load();
  if (typeof handler !== 'function') {
    throw new Error(`Invalid handler for tool: ${name}`);
  }

  return handler;
}

function getRegisteredToolNames() {
  return Object.keys(handlerLoaders);
}

module.exports = {
  getToolHandler,
  getRegisteredToolNames,
};
