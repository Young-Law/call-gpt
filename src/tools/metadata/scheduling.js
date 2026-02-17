const schedulingTools = [
  {
    type: 'function',
    function: {
      name: 'createCrmLeadAndEvent',
      say: 'Of course. Let me get that scheduled for you.',
      description: 'Creates a new lead in the CRM and schedules an appointment for them.',
      parameters: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          event_title: { type: 'string' },
          start_datetime: { type: 'string' },
          end_datetime: { type: 'string' },
          appointment_type: { type: 'string' },
          staff_member: { type: 'string' },
        },
        required: ['first_name', 'last_name', 'email', 'phone', 'event_title', 'start_datetime', 'end_datetime', 'appointment_type', 'staff_member'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listAppointmentTypes',
      say: 'Let me pull up the available appointment types.',
      description: 'Returns the configured list of appointment types for scheduling.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listStaffMembers',
      say: 'Let me pull up the available staff members.',
      description: 'Returns the configured list of staff members for scheduling.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkAvailability',
      say: 'One moment while I check the calendar.',
      description: 'Checks the CRM calendar for existing events to determine availability.',
      parameters: {
        type: 'object',
        properties: {
          start_datetime: { type: 'string' },
          end_datetime: { type: 'string' },
        },
        required: ['start_datetime', 'end_datetime'],
      },
    },
  },
];

module.exports = { schedulingTools };
