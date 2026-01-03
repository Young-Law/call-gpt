const { findCrmLeadByEmail, createCrmLead, createCrmEvent } = require('./zoho_crm');

function normalizeLabel(value) {
  return value.trim().toLowerCase();
}

function parseJsonList(value, envName) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`${envName} must be a JSON array.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid ${envName}: ${error.message}`);
  }
}

function findOption(options, input, { labelKeys, idKeys }) {
  if (!input) {
    return null;
  }
  const normalizedInput = normalizeLabel(input);
  return options.find((option) => {
    const labelMatch = labelKeys.some((key) => {
      const labelValue = option[key];
      return typeof labelValue === 'string' && normalizeLabel(labelValue) === normalizedInput;
    });
    if (labelMatch) {
      return true;
    }
    return idKeys.some((key) => option[key] === input);
  });
}

async function createCrmLeadAndEvent(args) {
  const {
    first_name,
    last_name,
    email,
    phone,
    event_title,
    start_datetime,
    end_datetime,
    appointment_type,
    staff_member,
  } = args;

  try {
    const appointmentTypes = parseJsonList(
      process.env.ZOHO_APPOINTMENT_TYPES_JSON,
      'ZOHO_APPOINTMENT_TYPES_JSON'
    );
    const staffMembers = parseJsonList(
      process.env.ZOHO_STAFF_MEMBERS_JSON,
      'ZOHO_STAFF_MEMBERS_JSON'
    );

    if (appointmentTypes.length === 0 || staffMembers.length === 0) {
      return {
        status: 'error',
        message:
          'Appointment types or staff members are not configured. Please set ZOHO_APPOINTMENT_TYPES_JSON and ZOHO_STAFF_MEMBERS_JSON.',
      };
    }

    const selectedAppointmentType = findOption(appointmentTypes, appointment_type, {
      labelKeys: ['name', 'label', 'appointment_type'],
      idKeys: ['resource_id', 'resourceId', 'id'],
    });
    if (!selectedAppointmentType) {
      return {
        status: 'error',
        message: `Unable to find appointment type "${appointment_type}".`,
      };
    }

    const selectedStaffMember = findOption(staffMembers, staff_member, {
      labelKeys: ['name', 'label', 'staff_member'],
      idKeys: ['staff_id', 'staffId', 'id'],
    });
    if (!selectedStaffMember) {
      return {
        status: 'error',
        message: `Unable to find staff member "${staff_member}".`,
      };
    }

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
      staff_id: selectedStaffMember.staff_id || selectedStaffMember.staffId || selectedStaffMember.id,
      resource_id:
        selectedAppointmentType.resource_id ||
        selectedAppointmentType.resourceId ||
        selectedAppointmentType.id,
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
