export type FieldLimits = [number, number]

export type Schema = {
  categories: Record<string, string[]>
  limits: Record<string, FieldLimits>
  band_rates: Record<string, number>
  base_rate: number
  test: {
    pr_auc: number
    roc_auc: number
  }
}

export type Prediction = {
  score: number
  band: 'High' | 'Medium' | 'Low'
  expected_rate: number
  base_rate: number
  advice: string
}

export type PredictionValues = Record<string, string | number>

export class ApiError extends Error {
  fieldErrors: Record<string, string>

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, options)
  } catch {
    throw new ApiError('Cannot reach the scoring server. Check that it is running.')
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('The scoring server returned an unreadable response.')
  }

  if (response.status === 422) {
    const errors = body as { errors?: Record<string, string> }
    throw new ApiError('Please correct the highlighted fields.', errors.errors ?? {})
  }

  if (!response.ok) {
    throw new ApiError('The scoring server returned an error. Please try again.')
  }

  return body as T
}

export function getSchema(): Promise<Schema> {
  return request<Schema>('/schema')
}

export function predict(values: PredictionValues): Promise<Prediction> {
  return request<Prediction>('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
}
