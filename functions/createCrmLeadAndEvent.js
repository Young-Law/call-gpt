const { findCrmLeadByEmail, createCrmLead, createCrmEvent } = require('./zoho_crm');

async function createCrmLeadAndEvent(args) {
  const { first_name, last_name, email, phone, event_title, start_datetime, end_datetime } = args;

  try {
    let lead = await findCrmLeadByEmail(email);
    let leadId;

    if (lead) {
      console.log(`Found existing lead with ID: ${lead.id}`);
      leadId = lead.id;
    } else {
      console.log('No existing lead found. Creating a new one...');
      const leadDetails = { first_name, last_name, email, phone };
      leadId = await createCrmLead(leadDetails);
      console.log(`Successfully created new lead with ID: ${leadId}`);
    }

    const eventDetails = {
      event_title,
      start_datetime,
      end_datetime,
      lead_id: leadId,
    };

    const eventId = await createCrmEvent(eventDetails);
    console.log(`Successfully created event with ID: ${eventId}`);
    return { status: 'success', lead_id: leadId, event_id: eventId };
  } catch (error) {
    console.error('Error in createCrmLeadAndEvent:', error);
    return { status: 'error', message: error.message };
  }
}

module.exports = createCrmLeadAndEvent;
