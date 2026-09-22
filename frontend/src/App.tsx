import { useEffect, useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError, getSchema, predict, type Prediction, type Schema } from '@/lib/api'
import { fields, type FieldDefinition, type FieldKey } from '@/fields'

type FormValues = Record<FieldKey, string>

const emptyValues = (): FormValues =>
  Object.fromEntries(fields.map((field) => [field.key, ''])) as FormValues

const groups = ['About the client', 'Financial situation', 'Contact plan and history']

function App() {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getSchema()
      .then(setSchema)
      .catch((error: unknown) => {
        setFormError(error instanceof ApiError ? error.message : 'Could not load the form.')
      })
      .finally(() => setLoading(false))
  }, [])

  function updateValue(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setFormError('')
  }

  function validate(): Record<string, string> {
    if (!schema) return {}
    const errors: Record<string, string> = {}

    for (const field of fields) {
      const value = values[field.key].trim()
      if (!value) {
        errors[field.key] = 'This field is required.'
        continue
      }

      if (field.kind === 'number') {
        const number = Number(value)
        const limits = schema.limits[field.key]
        if (!Number.isInteger(number)) {
          errors[field.key] = 'Enter a whole number.'
        } else if (limits && (number < limits[0] || number > limits[1])) {
          errors[field.key] = `Enter a value from ${limits[0]} to ${limits[1]}.`
        }
      } else if (!schema.categories[field.key]?.includes(value)) {
        errors[field.key] = 'Choose one of the listed options.'
      }
    }

    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Please correct the highlighted fields.')
      return
    }

    const payload = Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.kind === 'number' ? Number(values[field.key]) : values[field.key],
      ]),
    )

    setSubmitting(true)
    setFormError('')
    setFieldErrors({})
    try {
      setResult(await predict(payload))
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        setFieldErrors(error.fieldErrors)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section>
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Bank campaign desk
            </p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Find the next best call.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Enter the client details available before the call. The score ranks who to contact first.
            </p>
          </div>

          {formError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Could not score this client</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-7" noValidate>
            {groups.map((group) => (
              <Card key={group} className="border-stone-200 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{group}</CardTitle>
                  <CardDescription>
                    {group === 'About the client' && 'Basic information from the customer record.'}
                    {group === 'Financial situation' && 'Current lending and balance indicators.'}
                    {group === 'Contact plan and history' && 'Details known before this campaign call.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  {fields
                    .filter((field) => field.group === group)
                    .map((field) => (
                      <FieldControl
                        key={field.key}
                        field={field}
                        schema={schema}
                        value={values[field.key]}
                        error={fieldErrors[field.key]}
                        disabled={loading || submitting}
                        onChange={updateValue}
                      />
                    ))}
                </CardContent>
              </Card>
            ))}

            <Button type="submit" disabled={loading || submitting || !schema} className="h-11 w-full sm:w-auto">
              {submitting ? 'Scoring client...' : 'Score this client'}
            </Button>
          </form>
        </section>

        <aside className="lg:sticky lg:top-8">
          <ResultCard result={result} schema={schema} />
        </aside>
      </div>
    </main>
  )
}

type FieldControlProps = {
  field: FieldDefinition
  schema: Schema | null
  value: string
  error?: string
  disabled: boolean
  onChange: (key: FieldKey, value: string) => void
}

function FieldControl({ field, schema, value, error, disabled, onChange }: FieldControlProps) {
  const inputId = `field-${field.key}`
  const limits = schema?.limits[field.key]
  const categories = schema?.categories[field.key] ?? []

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-sm font-medium">
        {field.label}
      </Label>
      {field.kind === 'select' ? (
        <Select value={value} onValueChange={(next) => onChange(field.key, next ?? '')} disabled={disabled}>
          <SelectTrigger id={inputId} aria-invalid={Boolean(error)} className="h-10 w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          step="1"
          min={limits?.[0]}
          max={limits?.[1]}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      )}
      {field.hint && <p className="text-xs leading-5 text-stone-500">{field.hint}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

function ResultCard({ result, schema }: { result: Prediction | null; schema: Schema | null }) {
  return (
    <Card className="overflow-hidden border-stone-200 bg-stone-950 text-stone-50 shadow-xl">
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Call priority</p>
        <CardTitle className="text-2xl text-white">Your score</CardTitle>
        <CardDescription className="text-stone-400">
          A clear signal for campaign planning, based on the information entered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!result ? (
          <div className="rounded-lg border border-dashed border-stone-700 px-4 py-8 text-center text-sm leading-6 text-stone-400">
            Complete the form to see the client’s call priority.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Badge className="bg-emerald-400 px-3 py-1 text-sm text-stone-950 hover:bg-emerald-400">
                {result.band}
              </Badge>
              <span className="font-mono text-3xl font-semibold text-white">{Math.round(result.score * 100)}%</span>
            </div>
            <Progress value={result.score * 100} className="h-3 bg-stone-800" />
            <p className="text-sm leading-6 text-stone-200">
              In our held-out test data, {formatPercent(result.expected_rate)} of clients in this band subscribed. Across all clients the rate is {formatPercent(result.base_rate)}.
            </p>
            <p className="border-t border-stone-800 pt-4 text-xs leading-5 text-stone-400">
              The bar ranks clients and is an estimate, not a promise.
            </p>
          </div>
        )}
        {schema && !result && (
          <p className="mt-5 text-xs text-stone-500">Overall observed rate: {formatPercent(schema.base_rate)}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default App
