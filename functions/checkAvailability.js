const { getEventsByTimeRange } = require('./zoho_crm');

/**
 * Checks if a given time slot is available by looking for conflicting events.
 * @param {object} args - The arguments object.
 * @param {string} args.start_datetime - The start time of the slot in ISO 8601 format.
 * @param {string} args.end_datetime - The end time of the slot in ISO 8601 format.
 * @returns {object} An object indicating availability.
 */
async function checkAvailability(args) {
  const { start_datetime, end_datetime } = args;
  try {
    const conflictingEvents = await getEventsByTimeRange(start_datetime, end_datetime);

    if (conflictingEvents.length > 0) {
      return { 
        is_available: false, 
        message: 'I am sorry, but that time slot is not available. Please suggest another time.' 
      };
    }

    return { 
      is_available: true, 
      message: 'That time slot is available.' 
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { 
      is_available: false, 
      message: 'I encountered an error while checking the calendar. Please try again.' 
    };
  }
}

module.exports = checkAvailability;