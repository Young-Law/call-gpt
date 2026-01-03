const { listAppointmentTypes } = require('./zoho_crm');

async function listAppointmentTypesHandler() {
  const appointmentTypes = listAppointmentTypes();

  return {
    status: 'success',
    appointment_types: appointmentTypes,
  };
}

module.exports = listAppointmentTypesHandler;
