import { useEffect, useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ApiError,
  getInsights,
  getSchema,
  predict,
  predictBatch,
  type BatchRow,
  type InsightRule,
  type Prediction,
  type Schema,
} from '@/lib/api'
import { fields, type FieldDefinition, type FieldKey } from '@/fields'

type FormValues = Record<FieldKey, string>
type TabName = 'score' | 'insights' | 'batch'

const emptyValues = (): FormValues =>
  Object.fromEntries(fields.map((field) => [field.key, ''])) as FormValues

const groups = ['About the client', 'Financial situation', 'Contact plan and history']
const runtimeSummary = 'Notebook 04 compared Apriori and FP-Growth at minimum support 0.05, 0.03, 0.02 and 0.01. Both algorithms returned the same itemset counts: 10,476; 19,093; 28,026; and 49,684 respectively. See the notebook runtime plot for the measured seconds.'

function App() {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabName>('score')
  const [insights, setInsights] = useState<{ rules: InsightRule[]; tree_text: string } | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [batchRows, setBatchRows] = useState<BatchRow[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState('')

  useEffect(() => {
    getSchema()
      .then(setSchema)
      .catch((error: unknown) => {
        setFormError(error instanceof ApiError ? error.message : 'Could not load the form.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'insights' || insights || insightsLoading) return
    setInsightsLoading(true)
    setInsightsError('')
    getInsights()
      .then(setInsights)
      .catch((error: unknown) => {
        setInsightsError(error instanceof ApiError ? error.message : 'Could not load subscription insights.')
      })
      .finally(() => setInsightsLoading(false))
  }, [activeTab, insights, insightsLoading])

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
        if (!Number.isInteger(number)) errors[field.key] = 'Enter a whole number.'
        else if (limits && (number < limits[0] || number > limits[1])) {
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
      fields.map((field) => [field.key, field.kind === 'number' ? Number(values[field.key]) : values[field.key]]),
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
      } else setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBatchUpload(file: File | undefined) {
    if (!file) return
    setBatchLoading(true)
    setBatchError('')
    setBatchRows([])
    try {
      setBatchRows(await predictBatch(file))
    } catch (error: unknown) {
      setBatchError(error instanceof ApiError ? error.fieldErrors.file ?? error.message : 'This file was not accepted.')
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Bank campaign desk</p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Find the next best call.</h1>
          <p className="mt-4 text-base leading-7 text-stone-600">Prioritise conversations using the information available before the call.</p>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab((value ?? 'score') as TabName)}>
          <TabsList className="mb-8 grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
            <TabsTrigger value="score" className="h-10">Score a client</TabsTrigger>
            <TabsTrigger value="insights" className="h-10">What drives subscriptions</TabsTrigger>
            <TabsTrigger value="batch" className="h-10">Rank a call list</TabsTrigger>
          </TabsList>
          <TabsContent value="score"><ScoreTab schema={schema} values={values} fieldErrors={fieldErrors} formError={formError} loading={loading} submitting={submitting} result={result} onChange={updateValue} onSubmit={handleSubmit} /></TabsContent>
          <TabsContent value="insights"><InsightsTab insights={insights} loading={insightsLoading} error={insightsError} runtimeSummary={runtimeSummary} /></TabsContent>
          <TabsContent value="batch"><BatchTab rows={batchRows} loading={batchLoading} error={batchError} onUpload={handleBatchUpload} /></TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

type ScoreTabProps = {
  schema: Schema | null
  values: FormValues
  fieldErrors: Record<string, string>
  formError: string
  loading: boolean
  submitting: boolean
  result: Prediction | null
  onChange: (key: FieldKey, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function ScoreTab({ schema, values, fieldErrors, formError, loading, submitting, result, onChange, onSubmit }: ScoreTabProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section>
        {formError && <Alert variant="destructive" className="mb-6"><AlertTitle>Could not score this client</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}
        <form onSubmit={onSubmit} className="space-y-7" noValidate>
          {groups.map((group) => (
            <Card key={group} className="border-stone-200 bg-white shadow-sm">
              <CardHeader className="pb-4"><CardTitle className="text-xl">{group}</CardTitle><CardDescription>{group === 'About the client' ? 'Basic information from the customer record.' : group === 'Financial situation' ? 'Current lending and balance indicators.' : 'Details known before this campaign call.'}</CardDescription></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {fields.filter((field) => field.group === group).map((field) => <FieldControl key={field.key} field={field} schema={schema} value={values[field.key]} error={fieldErrors[field.key]} disabled={loading || submitting} onChange={onChange} />)}
              </CardContent>
            </Card>
          ))}
          <Button type="submit" disabled={loading || submitting || !schema} className="h-11 w-full sm:w-auto">{submitting ? 'Scoring client...' : 'Score this client'}</Button>
        </form>
      </section>
      <aside className="lg:sticky lg:top-8"><ResultCard result={result} schema={schema} /></aside>
    </div>
  )
}

type FieldControlProps = { field: FieldDefinition; schema: Schema | null; value: string; error?: string; disabled: boolean; onChange: (key: FieldKey, value: string) => void }

function FieldControl({ field, schema, value, error, disabled, onChange }: FieldControlProps) {
  const inputId = `field-${field.key}`
  const limits = schema?.limits[field.key]
  const categories = schema?.categories[field.key] ?? []
  return <div className="space-y-2">
    <Label htmlFor={inputId} className="text-sm font-medium">{field.label}</Label>
    {field.kind === 'select' ? <Select value={value} onValueChange={(next) => onChange(field.key, next ?? '')} disabled={disabled}>
      <SelectTrigger id={inputId} aria-invalid={Boolean(error)} className="h-10 w-full"><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
      <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
    </Select> : <Input id={inputId} type="number" inputMode="numeric" step="1" min={limits?.[0]} max={limits?.[1]} value={value} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => onChange(field.key, event.target.value)} />}
    {field.hint && <p className="text-xs leading-5 text-stone-500">{field.hint}</p>}
    {error && <p className="text-sm text-red-700">{error}</p>}
  </div>
}

function ResultCard({ result, schema }: { result: Prediction | null; schema: Schema | null }) {
  return <Card className="overflow-hidden border-stone-200 bg-stone-950 text-stone-50 shadow-xl"><CardHeader><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Call priority</p><CardTitle className="text-2xl text-white">Your score</CardTitle><CardDescription className="text-stone-400">A clear signal for campaign planning, based on the information entered.</CardDescription></CardHeader><CardContent>{!result ? <div className="rounded-lg border border-dashed border-stone-700 px-4 py-8 text-center text-sm leading-6 text-stone-400">Complete the form to see the client’s call priority.</div> : <div className="space-y-6"><div className="flex items-center justify-between gap-4"><Badge className="bg-emerald-400 px-3 py-1 text-sm text-stone-950 hover:bg-emerald-400">{result.band}</Badge><span className="font-mono text-3xl font-semibold text-white">{Math.round(result.score * 100)}%</span></div><Progress value={result.score * 100} className="h-3 bg-stone-800" /><p className="text-sm leading-6 text-stone-200">In our held-out test data, {formatPercent(result.expected_rate)} of clients in this band subscribed. Across all clients the rate is {formatPercent(result.base_rate)}.</p><p className="border-t border-stone-800 pt-4 text-xs leading-5 text-stone-400">The bar ranks clients and is an estimate, not a promise.</p></div>}{schema && !result && <p className="mt-5 text-xs text-stone-500">Overall observed rate: {formatPercent(schema.base_rate)}</p>}</CardContent></Card>
}

function InsightsTab({ insights, loading, error, runtimeSummary }: { insights: { rules: InsightRule[]; tree_text: string } | null; loading: boolean; error: string; runtimeSummary: string }) {
  if (loading) return <Card><CardContent className="py-12 text-center text-stone-600">Loading subscription insights...</CardContent></Card>
  if (error) return <Alert variant="destructive"><AlertTitle>Could not load insights</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  if (!insights || insights.rules.length === 0) return <Card><CardContent className="py-12 text-center text-stone-600">The insights are not available yet. Run notebook 04 to create models/insights.json.</CardContent></Card>
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Rules that lift subscription rates</CardTitle><CardDescription>These patterns are associations, not promises.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Rule</TableHead><TableHead>Support</TableHead><TableHead>Confidence</TableHead><TableHead>Lift</TableHead></TableRow></TableHeader><TableBody>{insights.rules.map((rule, index) => <TableRow key={`${rule.text}-${index}`}><TableCell className="min-w-72">{rule.text}</TableCell><TableCell>{formatPercent(rule.support)}</TableCell><TableCell>{formatPercent(rule.confidence)}</TableCell><TableCell>{rule.lift.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card><Card><CardHeader><CardTitle>Decision-tree view</CardTitle></CardHeader><CardContent><pre className="max-h-96 overflow-auto rounded-lg bg-stone-950 p-4 text-xs leading-5 text-stone-100">{insights.tree_text}</pre></CardContent></Card><Card><CardHeader><CardTitle>Apriori versus FP-Growth</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-stone-600">{runtimeSummary}</p></CardContent></Card></div>
}

function BatchTab({ rows, loading, error, onUpload }: { rows: BatchRow[]; loading: boolean; error: string; onUpload: (file: File | undefined) => void }) {
  const columns = rows.length > 0 ? Object.keys(rows[0]).filter((column) => column !== 'score' && column !== 'band').slice(0, 4) : []
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Rank a call list</CardTitle><CardDescription>Upload a CSV with the same client columns as the scoring form.</CardDescription></CardHeader><CardContent><Label htmlFor="call-list" className="mb-2 block">Client CSV</Label><Input id="call-list" type="file" accept=".csv,text/csv" disabled={loading} onChange={(event) => onUpload(event.target.files?.[0])} />{loading && <p className="mt-3 text-sm text-stone-600">Ranking clients...</p>}{error && <p className="mt-3 text-sm text-red-700">{error}</p>}</CardContent></Card>{rows.length > 0 && <Card><CardHeader><CardTitle>Ranked clients</CardTitle><CardDescription>Showing up to the first 500 ranked rows.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}<TableHead>Score</TableHead><TableHead>Band</TableHead></TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={index}>{columns.map((column) => <TableCell key={column}>{String(row[column] ?? '')}</TableCell>)}<TableCell>{row.score.toFixed(3)}</TableCell><TableCell><Badge variant="outline">{row.band}</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}</div>
}

function formatPercent(value: number) { return `${(value * 100).toFixed(1)}%` }

export default App
