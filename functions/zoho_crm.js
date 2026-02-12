const axios = require('axios');
const { executeWithAuthRetry } = require('./zoho_auth');

const ZOHO_CRM_API_URL = 'https://www.zohoapis.com/crm/v2';

function parseSelectionList(rawList) {
    if (!rawList) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawList);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Unable to parse Zoho selection list JSON:', error.message);
        return [];
    }
}

function listAppointmentTypes() {
    return parseSelectionList(process.env.ZOHO_APPOINTMENT_TYPES);
}

function listStaffMembers() {
    return parseSelectionList(process.env.ZOHO_STAFF_MEMBERS);
}

function resolveSelection({ selection, list, idKeys, label }) {
    if (!selection) {
        return null;
    }

    const normalizedSelection = String(selection).trim().toLowerCase();

    if (list.length === 0) {
        return selection;
    }

    const match = list.find((item) => {
        if (!item || typeof item !== 'object') {
            return false;
        }

        const nameMatch = item.name && String(item.name).trim().toLowerCase() === normalizedSelection;
        if (nameMatch) {
            return true;
        }

        return idKeys.some((key) => item[key] && String(item[key]).trim().toLowerCase() === normalizedSelection);
    });

    if (!match) {
        const options = list
            .map((item) => item?.name || item?.id || item?.resource_id || item?.staff_id)
            .filter(Boolean)
            .join(', ');
        throw new Error(`${label} "${selection}" not found. Available options: ${options || 'none configured'}.`);
    }

    const idKey = idKeys.find((key) => match[key]);
    return match[idKey] || selection;
function withAuthHeaders(token) {
  return { Authorization: `Zoho-oauthtoken ${token}` };
}

// --- Function to Create a Lead ---
async function createCrmLead(leadDetails) {
  const { first_name, last_name, email, phone } = leadDetails;

  const crmData = {
    data: [{
      First_Name: first_name,
      Last_Name: last_name,
      Email: email,
      Phone: phone,
      Lead_Source: 'Phone Call Intake',
    }],
  };

  try {
    const response = await executeWithAuthRetry((token) => axios.post(
      `${ZOHO_CRM_API_URL}/Leads`,
      crmData,
      { headers: withAuthHeaders(token) },
    ));

    const result = response.data.data[0];
    if (result.status === 'success') {
      console.log(`Successfully created lead with ID: ${result.details.id}`);
      return result.details.id;
    }

    throw new Error(`Error creating CRM lead: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error('Error in createCrmLead:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function to Create an Event (Appointment) ---
async function createCrmEvent(eventDetails) {
    const token = await getAccessToken();
    const { event_title, start_datetime, end_datetime, lead_id, appointment_type, staff_member } = eventDetails;
  const { event_title, start_datetime, end_datetime, lead_id } = eventDetails;

  const eventPayload = {
    Event_Title: event_title,
    Start_DateTime: start_datetime,
    End_DateTime: end_datetime,
  };

  // If a lead_id is provided, link the event to that lead.
  if (lead_id) {
    eventPayload.$se_module = 'Leads';
    eventPayload.What_Id = {
      id: lead_id,
    };
  }

    const appointmentTypes = listAppointmentTypes();
    const staffMembers = listStaffMembers();
    const resourceId = resolveSelection({
        selection: appointment_type,
        list: appointmentTypes,
        idKeys: ['resource_id', 'id'],
        label: 'Appointment type',
    });
    const staffId = resolveSelection({
        selection: staff_member,
        list: staffMembers,
        idKeys: ['staff_id', 'id'],
        label: 'Staff member',
    });

    if (resourceId) {
        eventPayload.Resource_Id = resourceId;
    }

    if (staffId) {
        eventPayload.Staff_Id = staffId;
    }

    // If a lead_id is provided, link the event to that lead.
    if (lead_id) {
        eventPayload.$se_module = 'Leads';
        eventPayload.What_Id = {
            id: lead_id
        };
    }
  const eventData = {
    data: [eventPayload],
  };

  try {
    const response = await executeWithAuthRetry((token) => axios.post(
      `${ZOHO_CRM_API_URL}/Events`,
      eventData,
      { headers: withAuthHeaders(token) },
    ));

    const result = response.data.data[0];
    if (result.status === 'success') {
      console.log(`Successfully created event with ID: ${result.details.id}`);
      return result.details.id;
    }

    throw new Error(`Error creating CRM event: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error('Error in createCrmEvent:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function to Find a Lead by Email ---
async function findCrmLeadByEmail(email) {
  try {
    const response = await executeWithAuthRetry((token) => axios.get(
      `${ZOHO_CRM_API_URL}/Leads/search`,
      {
        params: { email },
        headers: withAuthHeaders(token),
      },
    ));

    if (response.data && response.data.data) {
      return response.data.data[0]; // Return the first matching lead
    }

    return null;
  } catch (error) {
    // If the error is that no records were found, return null.
    if (error.response && error.response.data && error.response.data.code === 'NO_RECORDS_FOUND') {
      return null;
    }

    console.error('Error in findCrmLeadByEmail:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function to Get Events by Time Range ---
async function getEventsByTimeRange(start_datetime, end_datetime) {
  const query = `select id from Events where (Start_DateTime <= '${end_datetime}' and End_DateTime >= '${start_datetime}')`;

  try {
    const response = await executeWithAuthRetry((token) => axios.post(
      `${ZOHO_CRM_API_URL}/coql`,
      { select_query: query },
      { headers: withAuthHeaders(token) },
    ));

    return response.data.data || []; // Return events or an empty array
  } catch (error) {
    // A 204 No Content response means no records were found, which is not an error for us.
    if (error.response && error.response.status === 204) {
      return [];
    }

    console.error('Error in getEventsByTimeRange:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
    createCrmLead,
    createCrmEvent,
    findCrmLeadByEmail,
    getEventsByTimeRange,
    listAppointmentTypes,
    listStaffMembers,
  createCrmLead,
  createCrmEvent,
  findCrmLeadByEmail,
  getEventsByTimeRange,
};
