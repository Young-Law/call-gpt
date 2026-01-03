// create metadata for all the available functions to pass to completions API
const tools = [
  {
    type: 'function',
    function: {
      name: 'createCrmLeadAndEvent',
      say: 'Of course. Let me get that scheduled for you.',
      description: 'Creates a new lead in the CRM and schedules an appointment for them. If the lead already exists, it schedules the appointment for the existing lead.',
      parameters: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            description: 'The first name of the person scheduling the appointment.',
          },
          last_name: {
            type: 'string',
            description: 'The last name of the person scheduling the appointment.',
          },
          email: {
            type: 'string',
            description: 'The email address of the person.',
          },
          phone: {
            type: 'string',
            description: 'The phone number of the person.',
          },
          event_title: {
            type: 'string',
            description: 'The title or name of the event.',
          },
          start_datetime: {
            type: 'string',
            description: "The start date and time for the appointment in ISO 8601 format (e.g., '2025-07-20T14:00:00-05:00').",
          },
          end_datetime: {
            type: 'string',
            description: "The end date and time for the appointment in ISO 8601 format (e.g., '2025-07-20T14:30:00-05:00').",
          },
          appointment_type: {
            type: 'string',
            description: 'The appointment type name or ID from the available appointment type list.',
          },
          staff_member: {
            type: 'string',
            description: 'The staff member name or ID from the available staff list.',
          },
        },
        required: ['first_name', 'last_name', 'email', 'phone', 'event_title', 'start_datetime', 'end_datetime'],
      },
      returns: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'A status message indicating if the lead and event were created successfully.'
          }
        }
      }
    },
  },
  {
    type: 'function',
    function: {
      name: 'listAppointmentTypes',
      say: 'Let me pull up the available appointment types.',
      description: 'Returns the configured list of appointment types for scheduling.',
      parameters: {
        type: 'object',
        properties: {},
      },
      returns: {
        type: 'object',
        properties: {
          appointment_types: {
            type: 'array',
            description: 'The available appointment types with IDs and names.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listStaffMembers',
      say: 'Let me pull up the available staff members.',
      description: 'Returns the configured list of staff members for scheduling.',
      parameters: {
        type: 'object',
        properties: {},
      },
      returns: {
        type: 'object',
        properties: {
          staff_members: {
            type: 'array',
            description: 'The available staff members with IDs and names.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkAvailability',
      say: 'One moment while I check the calendar.',
      description: 'Checks the CRM calendar for existing events to see if a requested time slot is free before scheduling an appointment.',
      parameters: {
        type: 'object',
        properties: {
          start_datetime: {
            type: 'string',
            description: "The start date and time for the proposed appointment in ISO 8601 format (e.g., '2025-07-20T14:00:00-05:00').",
          },
          end_datetime: {
            type: 'string',
            description: "The end date and time for the proposed appointment in ISO 8601 format (e.g., '2025-07-20T14:30:00-05:00').",
          },
        },
        required: ['start_datetime', 'end_datetime'],
      },
      returns: {
        type: 'object',
        properties: {
          is_available: {
            type: 'boolean',
            description: 'True if the time slot is available, false otherwise.'
          },
          message: {
            type: 'string',
            description: 'A message indicating the availability status.'
          }
        }
      }
    }
  }
];

module.exports = tools;
