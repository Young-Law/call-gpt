const { listAppointmentTypes } = require('../../integrations/zoho/client');

async function listAppointmentTypesHandler() {
  return { status: 'success', appointment_types: listAppointmentTypes() };
}

module.exports = { listAppointmentTypesHandler };
