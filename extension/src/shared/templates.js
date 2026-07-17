/**
 * Default Template Definitions
 * Same schema used by the backend — kept in sync.
 */

export const DEFAULT_TEMPLATES = [
  {
    templateId: 'redtomato-important-today',
    name: 'Red Tomato Workspace',
    description: 'Workspace layout grouping your emails into high-impact states like Follow-ups, Actions, and Risks.',
    rowKey: 'lead_client',
    aiInstructions: 'Analyze the inbox and organize emails into a work tracker workspace. Extract: lead/client name & subtitle, work type, current state (e.g. Needs action now, Follow-up due, Waiting for reply, Review or decision needed, Attachment review, Missing contact, Deadline risk, Low priority), why it matters, next step, and details/issues.',
    columns: [
      { id: 'lead_client', label: 'Lead / client', type: 'text' },
      { id: 'work_type', label: 'Work type', type: 'text' },
      { id: 'current_state', label: 'Current state', type: 'enum', options: ['Needs action now', 'Follow-up due', 'Waiting for reply', 'Review or decision needed', 'Attachment review', 'Missing contact', 'Deadline risk', 'Low priority'] },
      { id: 'why_it_matters', label: 'Why it matters', type: 'text' },
      { id: 'next_step', label: 'Next step', type: 'text' },
      { id: 'details', label: 'Details', type: 'text' },
    ],
    suggestedPrompts: [
      'Organise this inbox around customer success conversations.',
      'Show me all items grouped by client',
      'Show me items that need my reply today',
    ],
  },
  {
    templateId: 'recruiter-applicant-tracker',
    name: 'Applicant Tracker',
    description: 'Track job applicants, their roles, and application status',
    rowKey: 'candidate_email_thread',
    aiInstructions: 'Extract candidate/applicant information from each email. Look for job applications, resumes, cover letters, and recruiter correspondence. Group by candidate.',
    columns: [
      { id: 'candidate_name', label: 'Candidate', type: 'text' },
      { id: 'role', label: 'Role Applied For', type: 'text' },
      { id: 'date_received', label: 'Date', type: 'date' },
      { id: 'resume_attached', label: 'Resume', type: 'boolean' },
      { id: 'status', label: 'Status', type: 'enum', options: ['New', 'Reviewed', 'Interview', 'Rejected', 'Offer'] },
      { id: 'source', label: 'Source', type: 'enum', options: ['Direct', 'Referral', 'Job Board', 'LinkedIn', 'Other'] },
    ],
    suggestedPrompts: [
      'Show me all applicants from this week',
      'Which candidates applied for the engineering role?',
      'List applicants with resumes attached',
      'Show new applications I haven\'t reviewed yet',
    ],
  },
  {
    templateId: 'job-seeker-tracker',
    name: 'Application Tracker',
    description: 'Track your own job applications, statuses, and next steps',
    rowKey: 'company_thread',
    aiInstructions: 'Extract job application information from the user\'s perspective as a job seeker.',
    columns: [
      { id: 'company', label: 'Company', type: 'text' },
      { id: 'role', label: 'Role', type: 'text' },
      { id: 'date_applied', label: 'Date Applied', type: 'date' },
      { id: 'last_update', label: 'Last Update', type: 'date' },
      { id: 'status', label: 'Status', type: 'enum', options: ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Ghosted'] },
      { id: 'next_action', label: 'Next Action', type: 'text' },
    ],
    suggestedPrompts: [
      'Show all my active applications',
      'Which companies have I heard back from?',
      'List applications where I need to take action',
      'Show rejections from the last month',
    ],
  },
  {
    templateId: 'generic-inbox-sorter',
    name: 'Smart Inbox Sorter',
    description: 'AI-categorized view of your inbox with priorities and summaries',
    rowKey: 'message',
    aiInstructions: 'Categorize each email by its type and assign a priority level.',
    columns: [
      { id: 'sender', label: 'Sender', type: 'text' },
      { id: 'subject', label: 'Subject', type: 'text' },
      { id: 'category', label: 'Category', type: 'enum', options: ['Work', 'Personal', 'Newsletter', 'Notification', 'Transaction', 'Promotion', 'Social', 'Other'] },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'priority', label: 'Priority', type: 'enum', options: ['High', 'Medium', 'Low'] },
      { id: 'summary', label: 'Summary', type: 'text' },
    ],
    suggestedPrompts: [
      'Categorize my recent emails',
      'Show me high-priority emails from today',
      'What newsletters did I get this week?',
      'List all unread work emails',
    ],
  },
];

export function getTemplateById(templateId) {
  return DEFAULT_TEMPLATES.find(t => t.templateId === templateId) || DEFAULT_TEMPLATES[0];
}
