const axios = require('axios');
const { ZohoAuthClient } = require('./authClient');
const { config } = require('../../config');

const ZOHO_CRM_API_URL = 'https://www.zohoapis.com/crm/v2';
let zohoAuthClient;

function getZohoAuthClient() {
  if (!zohoAuthClient) zohoAuthClient = new ZohoAuthClient();
  return zohoAuthClient;
}

function parseSelectionList(rawList) {
  if (!rawList) return [];
  try {
    const parsed = JSON.parse(rawList);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to parse Zoho selection list JSON:', error.message);
    return [];
  }
}

function listAppointmentTypes() {
  return parseSelectionList(config.zoho.appointmentTypesRaw);
}

function listStaffMembers() {
  return parseSelectionList(config.zoho.staffMembersRaw);
}

function resolveSelection({ selection, list, idKeys, label }) {
  if (!selection) return null;
  const normalizedSelection = String(selection).trim().toLowerCase();
  const match = list.find((item) => {
    const nameMatch = item.name && String(item.name).trim().toLowerCase() === normalizedSelection;
    return nameMatch || idKeys.some((key) => item[key] && String(item[key]).trim().toLowerCase() === normalizedSelection);
  });

  if (!match) {
    const options = list.map((item) => item?.name || item?.id || item?.resource_id || item?.staff_id).filter(Boolean).join(', ');
    throw new Error(`${label} "${selection}" not found. Available options: ${options || 'none configured'}.`);
  }

  const idKey = idKeys.find((key) => match[key]);
  return match[idKey] || selection;
}

function withAuthHeaders(token) {
  return { Authorization: `Zoho-oauthtoken ${token}` };
}

async function createCrmLead(leadDetails) {
  const { first_name, last_name, email, phone } = leadDetails;
  const crmData = { data: [{ First_Name: first_name, Last_Name: last_name, Email: email, Phone: phone, Lead_Source: 'Phone Call Intake' }] };
  const response = await getZohoAuthClient().executeWithAuthRetry((token) => axios.post(`${ZOHO_CRM_API_URL}/Leads`, crmData, { headers: withAuthHeaders(token) }));
  return response.data.data[0].details.id;
}

async function createCrmEvent(eventDetails) {
  const { event_title, start_datetime, end_datetime, lead_id, appointment_type, staff_member } = eventDetails;
  const eventPayload = { Event_Title: event_title, Start_DateTime: start_datetime, End_DateTime: end_datetime };

  const resourceId = resolveSelection({ selection: appointment_type, list: listAppointmentTypes(), idKeys: ['resource_id', 'id'], label: 'Appointment type' });
  const staffId = resolveSelection({ selection: staff_member, list: listStaffMembers(), idKeys: ['staff_id', 'id'], label: 'Staff member' });

  if (resourceId) eventPayload.Resource_Id = resourceId;
  if (staffId) eventPayload.Staff_Id = staffId;
  if (lead_id) {
    eventPayload.$se_module = 'Leads';
    eventPayload.What_Id = { id: lead_id };
  }

  const response = await getZohoAuthClient().executeWithAuthRetry((token) => axios.post(`${ZOHO_CRM_API_URL}/Events`, { data: [eventPayload] }, { headers: withAuthHeaders(token) }));
  return response.data.data[0].details.id;
}

async function findCrmLeadByEmail(email) {
  try {
    const response = await getZohoAuthClient().executeWithAuthRetry((token) => axios.get(`${ZOHO_CRM_API_URL}/Leads/search`, { params: { email }, headers: withAuthHeaders(token) }));
    return response.data?.data?.[0] || null;
  } catch (error) {
    if (error.response?.data?.code === 'NO_RECORDS_FOUND') return null;
    throw error;
  }
}

async function getEventsByTimeRange(start_datetime, end_datetime) {
  const query = `select id from Events where (Start_DateTime <= '${end_datetime}' and End_DateTime >= '${start_datetime}')`;
  try {
    const response = await getZohoAuthClient().executeWithAuthRetry((token) => axios.post(`${ZOHO_CRM_API_URL}/coql`, { select_query: query }, { headers: withAuthHeaders(token) }));
    return response.data.data || [];
  } catch (error) {
    if (error.response?.status === 204) return [];
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
};
