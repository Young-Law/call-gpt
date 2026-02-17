const { findCrmLeadByEmail, createCrmLead, createCrmEvent } = require('../../integrations/zoho/client');

async function createCrmLeadAndEvent(args) {
  const { first_name, last_name, email, phone, event_title, start_datetime, end_datetime, appointment_type, staff_member } = args;
  const lead = await findCrmLeadByEmail(email);
  const leadId = lead ? lead.id : await createCrmLead({ first_name, last_name, email, phone });
  const eventId = await createCrmEvent({ event_title, start_datetime, end_datetime, lead_id: leadId, appointment_type, staff_member });
  return { status: 'success', lead_id: leadId, event_id: eventId };
}

module.exports = { createCrmLeadAndEvent };
