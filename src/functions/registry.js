const path = require('path');

const FUNCTION_MODULES = {
  createCrmLeadAndEvent: '../../functions/createCRMLeadAndEvent',
  listAppointmentTypes: '../../functions/listAppointmentTypes',
  listStaffMembers: '../../functions/listStaffMembers',
  checkAvailability: '../../functions/checkAvailablity',
};

function loadAvailableFunctions(tools) {
  return tools.reduce((acc, tool) => {
    const functionName = tool?.function?.name;

    if (!functionName) {
      return acc;
    }

    const modulePath = FUNCTION_MODULES[functionName];
    if (!modulePath) {
      throw new Error(`No module mapping configured for function: ${functionName}`);
    }

    const resolvedPath = path.join(__dirname, modulePath);
    acc[functionName] = async (...args) => {
      const handler = require(resolvedPath);
      return handler(...args);
    };

    return acc;
  }, {});
}

module.exports = {
  FUNCTION_MODULES,
  loadAvailableFunctions,
};
