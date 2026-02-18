const { getEventsByTimeRange } = require('../../integrations/zoho/client');

async function checkAvailability(args) {
  const { start_datetime, end_datetime } = args;
  const conflictingEvents = await getEventsByTimeRange(start_datetime, end_datetime);
  if (conflictingEvents.length > 0) {
    return { is_available: false, message: 'I am sorry, but that time slot is not available. Please suggest another time.' };
  }
  return { is_available: true, message: 'That time slot is available.' };
}

module.exports = { checkAvailability };
