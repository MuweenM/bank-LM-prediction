export type FieldKey =
  | 'age'
  | 'job'
  | 'marital'
  | 'education'
  | 'balance'
  | 'default'
  | 'housing'
  | 'loan'
  | 'contact'
  | 'month'
  | 'day'
  | 'campaign'
  | 'pdays'
  | 'previous'
  | 'poutcome'

export type FieldDefinition = {
  key: FieldKey
  label: string
  group: string
  kind: 'number' | 'select'
  hint?: string
}

export const fields: FieldDefinition[] = [
  { key: 'age', label: 'Age', group: 'About the client', kind: 'number' },
  { key: 'job', label: 'Job', group: 'About the client', kind: 'select' },
  { key: 'marital', label: 'Marital status', group: 'About the client', kind: 'select' },
  { key: 'education', label: 'Education', group: 'About the client', kind: 'select' },
  {
    key: 'balance',
    label: 'Balance',
    group: 'Financial situation',
    kind: 'number',
    hint: 'Average yearly balance in euros',
  },
  { key: 'default', label: 'Credit in default', group: 'Financial situation', kind: 'select' },
  { key: 'housing', label: 'Housing loan', group: 'Financial situation', kind: 'select' },
  { key: 'loan', label: 'Personal loan', group: 'Financial situation', kind: 'select' },
  { key: 'contact', label: 'Contact channel', group: 'Contact plan and history', kind: 'select' },
  { key: 'month', label: 'Month', group: 'Contact plan and history', kind: 'select' },
  {
    key: 'day',
    label: 'Planned day of month',
    group: 'Contact plan and history',
    kind: 'number',
  },
  {
    key: 'campaign',
    label: 'Campaign contacts so far',
    group: 'Contact plan and history',
    kind: 'number',
    hint: 'Contacts in this campaign so far, including this one',
  },
  {
    key: 'pdays',
    label: 'Days since previous campaign',
    group: 'Contact plan and history',
    kind: 'number',
    hint: 'Enter -1 if the client was never contacted before',
  },
  {
    key: 'previous',
    label: 'Previous contacts',
    group: 'Contact plan and history',
    kind: 'number',
  },
  {
    key: 'poutcome',
    label: 'Previous campaign outcome',
    group: 'Contact plan and history',
    kind: 'select',
  },
]
