const axios = require('axios');
const { getAccessToken } = require('./zoho_auth');

const ZOHO_CRM_API_URL = 'https://www.zohoapis.com/crm/v2';

// --- Function to Create a Lead ---
async function createCrmLead(leadDetails) {
    const token = await getAccessToken();
    const { first_name, last_name, email, phone } = leadDetails;

    const crmData = {
        data: [{
            First_Name: first_name,
            Last_Name: last_name,
            Email: email,
            Phone: phone,
            Lead_Source: 'Phone Call Intake',
        }]
    };

    try {
        const response = await axios.post(`${ZOHO_CRM_API_URL}/Leads`, crmData, {
            headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
        });

        const result = response.data.data[0];
        if (result.status === 'success') {
            console.log(`Successfully created lead with ID: ${result.details.id}`);
            return result.details.id;
        } else {
            throw new Error(`Error creating CRM lead: ${JSON.stringify(result)}`);
        }
    } catch (error) {
        console.error('Error in createCrmLead:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// --- Function to Create an Event (Appointment) ---
async function createCrmEvent(eventDetails) {
    const token = await getAccessToken();
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
            id: lead_id
        };
    }

    const eventData = {
        data: [eventPayload]
    };

    try {
        const response = await axios.post(`${ZOHO_CRM_API_URL}/Events`, eventData, {
            headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
        });

        const result = response.data.data[0];
        if (result.status === 'success') {
            console.log(`Successfully created event with ID: ${result.details.id}`);
            return result.details.id;
        } else {
            throw new Error(`Error creating CRM event: ${JSON.stringify(result)}`);
        }
    } catch (error) {
        console.error('Error in createCrmEvent:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// --- Function to Find a Lead by Email ---
async function findCrmLeadByEmail(email) {
    const token = await getAccessToken();
    try {
        const response = await axios.get(`${ZOHO_CRM_API_URL}/Leads/search`, {
            params: { email: email },
            headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
        });
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
    const token = await getAccessToken();
    const query = `select id from Events where (Start_DateTime <= '${end_datetime}' and End_DateTime >= '${start_datetime}')`;

    try {
        const response = await axios.post(`${ZOHO_CRM_API_URL}/coql`, {
            select_query: query
        }, {
            headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
        });
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
};
