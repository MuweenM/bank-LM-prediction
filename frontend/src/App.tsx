import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BorderBeam } from 'border-beam'

// ─── Types ───────────────────────────────────────────────────────────
type FormValues = Record<FieldKey, string>
type TabName = 'score' | 'insights' | 'batch'

const emptyValues = (): FormValues =>
  Object.fromEntries(fields.map((f) => [f.key, ''])) as FormValues

const GROUPS = ['About the client', 'Financial situation', 'Contact plan and history']
const GROUP_DESCRIPTIONS: Record<string, string> = {
  'About the client': 'Basic information from the customer record.',
  'Financial situation': 'Current lending and balance indicators.',
  'Contact plan and history': 'Details known before this campaign call.',
}

const RUNTIME_SUMMARY =
  'Notebook 04 compared Apriori and FP-Growth at minimum support 0.05, 0.03, 0.02 and 0.01. Both algorithms returned the same itemset counts: 10,476; 19,093; 28,026; and 49,684 respectively. See the notebook runtime plot for the measured seconds.'

// ─── App ─────────────────────────────────────────────────────────────
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
      .catch((err: unknown) => {
        setFormError(err instanceof ApiError ? err.message : 'Could not load the form.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'insights' || insights || insightsLoading) return
    setInsightsLoading(true)
    setInsightsError('')
    getInsights()
      .then(setInsights)
      .catch((err: unknown) => {
        setInsightsError(err instanceof ApiError ? err.message : 'Could not load subscription insights.')
      })
      .finally(() => setInsightsLoading(false))
  }, [activeTab, insights, insightsLoading])

  function updateValue(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
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
      if (!value) { errors[field.key] = 'This field is required.'; continue }
      if (field.kind === 'number') {
        const n = Number(value)
        const limits = schema.limits[field.key]
        if (!Number.isInteger(n)) errors[field.key] = 'Enter a whole number.'
        else if (limits && (n < limits[0] || n > limits[1]))
          errors[field.key] = `Enter a value from ${limits[0]} to ${limits[1]}.`
      } else if (!schema.categories[field.key]?.includes(value)) {
        errors[field.key] = 'Choose one of the listed options.'
      }
    }
    return errors
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError('Please correct the highlighted fields.')
      return
    }
    const payload = Object.fromEntries(
      fields.map((f) => [f.key, f.kind === 'number' ? Number(values[f.key]) : values[f.key]]),
    )
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})
    try {
      setResult(await predict(payload))
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        setFieldErrors(err.fieldErrors)
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
    } catch (err: unknown) {
      setBatchError(
        err instanceof ApiError ? (err.fieldErrors.file ?? err.message) : 'This file was not accepted.',
      )
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-canvas)' }}>
      {/* ─── Primary Nav ─────────────────────────────────────────────── */}
      <nav className="primary-nav">
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
          <img
            src="/logo.png"
            alt="HelaBankScore"
            width="24"
            height="24"
            style={{ width: 24, height: 24, objectFit: 'contain', display: 'block' }}
          />
          <span className="text-body-sm-strong" style={{ color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
            HelaBankScore
          </span>
        </div>

        {/* Center pill tabs */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="pill-tabs" style={{ display: 'flex' }}>
            {(['score', 'insights', 'batch'] as TabName[]).map((tab) => {
              const labels: Record<TabName, string> = {
                score: 'Score a client',
                insights: 'Subscription drivers',
                batch: 'Rank a call list',
              }
              return (
                <button
                  key={tab}
                  className={`pill-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right cluster */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {schema && (
            <span className="text-caption-sm" style={{ color: 'var(--color-mute)' }}>
              Base rate {formatPercent(schema.base_rate)}
            </span>
          )}
        </div>
      </nav>

      {/* ─── Hero Stripe Band ─────────────────────────────────────────── */}
      <div className="hero-stripe-band">
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 760,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div className="badge-info" style={{ marginBottom: 16, display: 'inline-flex' }}>
            Bank Marketing Analytics
          </div>
          <h1
            className="text-display-xl"
            style={{ color: 'var(--color-ink)', margin: '0 0 20px' }}
          >
            Find the next
            <br />
            best call.
          </h1>
          <p
            className="text-body-lg"
            style={{ color: 'var(--color-body)', maxWidth: 480, margin: '0 auto 32px' }}
          >
            Prioritise conversations using a gradient-boosted model trained on 45,000 bank
            campaign contacts. Score clients before you dial.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => setActiveTab('score')}>
              Score a client
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab('batch')}>
              Rank a call list →
            </button>
          </div>


        </div>
      </div>

      {/* ─── Tab Content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px 96px' }}>
        {activeTab === 'score' && (
          <ScoreTab
            schema={schema}
            values={values}
            fieldErrors={fieldErrors}
            formError={formError}
            loading={loading}
            submitting={submitting}
            result={result}
            onChange={updateValue}
            onSubmit={handleSubmit}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsTab
            insights={insights}
            loading={insightsLoading}
            error={insightsError}
            runtimeSummary={RUNTIME_SUMMARY}
          />
        )}
        {activeTab === 'batch' && (
          <BatchTab
            rows={batchRows}
            loading={batchLoading}
            error={batchError}
            onUpload={handleBatchUpload}
          />
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: 'var(--color-canvas)',
          borderTop: '1px solid var(--color-hairline)',
          padding: '40px 48px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/logo.png"
              alt="HelaBankScore"
              width="20"
              height="20"
              style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }}
            />
            <span className="text-caption-sm" style={{ color: 'var(--color-mute)' }}>
              HelaBankScore
            </span>
          </div>
          <span className="text-caption-sm" style={{ color: 'var(--color-stone)' }}>
          
          </span>
        </div>
      </footer>
    </div>
  )
}

// ─── Score Tab ────────────────────────────────────────────────────────
type ScoreTabProps = {
  schema: Schema | null
  values: FormValues
  fieldErrors: Record<string, string>
  formError: string
  loading: boolean
  submitting: boolean
  result: Prediction | null
  onChange: (key: FieldKey, value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

function ScoreTab({ schema, values, fieldErrors, formError, loading, submitting, result, onChange, onSubmit }: ScoreTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>
      {/* Form section */}
      <section>
        {/* Section heading */}
        <div style={{ marginBottom: 32 }}>
          <h2 className="text-heading-lg" style={{ color: 'var(--color-ink)', margin: '0 0 8px' }}>
            Score a client
          </h2>
          <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            Enter the client's details to get a subscription probability score and call priority band.
          </p>
        </div>

        {/* Error alert */}
        {formError && (
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: 'var(--color-accent-red-soft)',
              border: '1px solid var(--color-accent-red)',
              borderRadius: 'var(--rounded-lg)',
              padding: '12px 16px',
              marginBottom: 24,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="7" stroke="#ff6161" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 11h.01" stroke="#ff6161" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-body-sm-strong" style={{ color: 'var(--color-accent-red)', margin: '0 0 2px' }}>
                Could not score this client
              </p>
              <p className="text-body-sm" style={{ color: 'var(--color-accent-red)', opacity: 0.85, margin: 0 }}>
                {formError}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {GROUPS.map((group) => (
            <div key={group} className="feature-card">
              {/* Card header */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
                <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: '0 0 4px' }}>
                  {group}
                </h3>
                <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
                  {GROUP_DESCRIPTIONS[group]}
                </p>
              </div>

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                {fields
                  .filter((f) => f.group === group)
                  .map((field) => (
                    <FieldControl
                      key={field.key}
                      field={field}
                      schema={schema}
                      value={values[field.key]}
                      error={fieldErrors[field.key]}
                      disabled={loading || submitting}
                      onChange={onChange}
                    />
                  ))}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || submitting || !schema}
              style={{ height: 40, paddingLeft: 24, paddingRight: 24, fontSize: 14 }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Scoring client…
                </span>
              ) : (
                'Score this client'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Result sidebar */}
      <aside style={{ position: 'sticky', top: 72 }}>
        <ResultCard result={result} schema={schema} />
      </aside>
    </div>
  )
}

// ─── Field Control ────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={inputId}
        className="text-body-sm-strong"
        style={{ color: 'var(--color-charcoal)' }}
      >
        {field.label}
      </label>

      {field.kind === 'select' ? (
        <Select
          value={value}
          onValueChange={(next) => onChange(field.key, next ?? '')}
          disabled={disabled}
        >
          <SelectTrigger
            id={inputId}
            aria-invalid={Boolean(error)}
            style={{
              height: 36,
              backgroundColor: 'var(--color-surface-elevated)',
              border: `1px solid ${error ? 'var(--color-accent-red)' : 'var(--color-hairline)'}`,
              borderRadius: 'var(--rounded-md)',
              color: value ? 'var(--color-on-dark)' : 'var(--color-ash)',
              fontSize: 14,
            }}
          >
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--rounded-md)',
            }}
          >
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} style={{ fontSize: 14 }}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          step="1"
          min={limits?.[0]}
          max={limits?.[1]}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="text-input"
          style={{
            borderColor: error ? 'var(--color-accent-red)' : undefined,
          }}
          placeholder={limits ? `${limits[0]}–${limits[1]}` : ''}
        />
      )}

      {field.hint && (
        <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
          {field.hint}
        </p>
      )}
      {error && (
        <p className="text-caption-sm" style={{ color: 'var(--color-accent-red)', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Result Card ──────────────────────────────────────────────────────
function ResultCard({ result, schema }: { result: Prediction | null; schema: Schema | null }) {
  const bandColor = result
    ? result.band === 'High'
      ? 'var(--color-accent-green)'
      : result.band === 'Medium'
        ? 'var(--color-accent-yellow)'
        : 'var(--color-accent-red)'
    : 'var(--color-mute)'

  const scorePercent = result ? result.score * 100 : 0

  const progressClass =
    result?.band === 'High' ? '' : result?.band === 'Medium' ? 'medium' : result?.band === 'Low' ? 'low' : ''

  return (
    <BorderBeam
      size="md"
      colorVariant="colorful"
      theme="dark"
      strength={result ? 1 : 0.4}
      brightness={3}
      saturation={1.5}
      style={{ borderRadius: 'var(--rounded-lg)', display: 'block' }}
    >
      <div
        className="feature-card-elevated animate-fade-in"
        style={{ borderColor: result ? 'var(--color-hairline-strong)' : 'var(--color-hairline)', borderRadius: 'var(--rounded-lg)' }}
      >
      {/* Header */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
        <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: '0 0 6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Call priority
        </p>
        <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: 0 }}>
          Subscription score
        </h3>
      </div>

      {!result ? (
        <div
          style={{
            border: '1px dashed var(--color-hairline-strong)',
            borderRadius: 'var(--rounded-lg)',
            padding: '28px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
          <p className="text-body-sm" style={{ color: 'var(--color-ash)', margin: 0 }}>
            Complete the form to see this client's call priority and subscription probability.
          </p>
          {schema && (
            <p className="text-caption-sm" style={{ color: 'var(--color-stone)', marginTop: 12 }}>
              Overall base rate: {formatPercent(schema.base_rate)}
            </p>
          )}
        </div>
      ) : (
        <div className="animate-score-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Score display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  className={`badge-${result.band.toLowerCase()}`}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  {result.band} priority
                </span>
              </div>
              <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
                Subscription probability
              </p>
            </div>
            <span
              style={{
                fontFamily: 'Inter, monospace',
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 1,
                color: bandColor,
                letterSpacing: '-1px',
              }}
            >
              {Math.round(scorePercent)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="ds-progress">
            <div
              className={`ds-progress-fill ${progressClass}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderRadius: 'var(--rounded-md)',
                padding: '10px 12px',
              }}
            >
              <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: '0 0 2px' }}>
                Band rate
              </p>
              <p className="text-body-sm-strong" style={{ color: 'var(--color-ink)', margin: 0 }}>
                {formatPercent(result.expected_rate)}
              </p>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderRadius: 'var(--rounded-md)',
                padding: '10px 12px',
              }}
            >
              <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: '0 0 2px' }}>
                Base rate
              </p>
              <p className="text-body-sm-strong" style={{ color: 'var(--color-ink)', margin: 0 }}>
                {formatPercent(result.base_rate)}
              </p>
            </div>
          </div>

          {/* Advice */}
          {result.advice && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderRadius: 'var(--rounded-md)',
                padding: '12px 14px',
              }}
            >
              <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: '0 0 4px' }}>
                Model advice
              </p>
              <p className="text-body-sm" style={{ color: 'var(--color-body)', margin: 0 }}>
                {result.advice}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p
            className="text-caption-sm"
            style={{
              color: 'var(--color-stone)',
              margin: 0,
              paddingTop: 12,
              borderTop: '1px solid var(--color-hairline)',
            }}
          >
            The score ranks clients and is an estimate, not a promise.
          </p>
        </div>
      )}
      </div>
    </BorderBeam>
  )
}

// ─── Insights Tab ─────────────────────────────────────────────────────
function InsightsTab({
  insights,
  loading,
  error,
  runtimeSummary,
}: {
  insights: { rules: InsightRule[]; tree_text: string } | null
  loading: boolean
  error: string
  runtimeSummary: string
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <h2 className="text-heading-lg" style={{ color: 'var(--color-ink)', margin: '0 0 8px' }}>
            What drives subscriptions
          </h2>
          <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            Association rules and a decision-tree summary from the training dataset.
          </p>
        </div>
        <div className="feature-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            Loading subscription insights…
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            backgroundColor: 'var(--color-accent-red-soft)',
            border: '1px solid var(--color-accent-red)',
            borderRadius: 'var(--rounded-lg)',
            padding: '12px 16px',
          }}
        >
          <p className="text-body-sm-strong" style={{ color: 'var(--color-accent-red)', margin: '0 0 2px' }}>
            Could not load insights
          </p>
          <p className="text-body-sm" style={{ color: 'var(--color-accent-red)', opacity: 0.85, margin: 0 }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (!insights || insights.rules.length === 0) {
    return (
      <div className="feature-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
        <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
          Insights are not available yet. Run notebook 04 to create{' '}
          <code
            className="text-caption-sm"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              padding: '1px 5px',
              borderRadius: 'var(--rounded-xs)',
              color: 'var(--color-accent-blue)',
            }}
          >
            models/insights.json
          </code>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Section heading */}
      <div>
        <h2 className="text-heading-lg" style={{ color: 'var(--color-ink)', margin: '0 0 8px' }}>
          What drives subscriptions
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
          Association rules mined from the training dataset. These are patterns, not promises.
        </p>
      </div>

      {/* Association rules */}
      <div className="feature-card">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
          <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: '0 0 4px' }}>
            Rules that lift subscription rates
          </h3>
          <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            Sorted by lift — the higher the lift, the stronger the association with subscription.
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Support</th>
                <th>Confidence</th>
                <th>Lift</th>
              </tr>
            </thead>
            <tbody>
              {insights.rules.map((rule, i) => (
                <tr key={`${rule.text}-${i}`}>
                  <td style={{ minWidth: 280, color: 'var(--color-charcoal)' }}>{rule.text}</td>
                  <td>{formatPercent(rule.support)}</td>
                  <td>{formatPercent(rule.confidence)}</td>
                  <td>
                    <span
                      className="badge-info"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {rule.lift.toFixed(2)}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision tree */}
      <div className="feature-card">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
          <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: 0 }}>
            Decision-tree view
          </h3>
        </div>
        <pre
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--rounded-md)',
            padding: '16px',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--color-body)',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 420,
            margin: 0,
            fontFamily: '"JetBrains Mono", "Geist Mono", "Fira Code", monospace',
          }}
        >
          {insights.tree_text}
        </pre>
      </div>

      {/* Apriori vs FP-Growth */}
      <div className="feature-card">
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: 0 }}>
              Apriori versus FP-Growth
            </h3>
            <span className="badge-pro">Notebook 04</span>
          </div>
        </div>
        <p className="text-body-sm" style={{ color: 'var(--color-body)', margin: 0, lineHeight: 1.7 }}>
          {runtimeSummary}
        </p>
      </div>
    </div>
  )
}

// ─── Batch Tab ────────────────────────────────────────────────────────
function BatchTab({
  rows,
  loading,
  error,
  onUpload,
}: {
  rows: BatchRow[]
  loading: boolean
  error: string
  onUpload: (file: File | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const columns =
    rows.length > 0
      ? Object.keys(rows[0])
          .filter((col) => col !== 'score' && col !== 'band')
          .slice(0, 4)
      : []

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Section heading */}
      <div>
        <h2 className="text-heading-lg" style={{ color: 'var(--color-ink)', margin: '0 0 8px' }}>
          Rank a call list
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
          Upload a CSV with the same client columns as the scoring form. The model will score and
          sort every row by subscription probability.
        </p>
      </div>

      {/* Upload card */}
      <div className="feature-card">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)' }}>
          <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: '0 0 4px' }}>
            Upload client CSV
          </h3>
          <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            CSV columns must match the scoring form fields exactly.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="upload-zone"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Click to upload CSV file"
        >
          <input
            ref={inputRef}
            id="call-list"
            type="file"
            accept=".csv,text/csv"
            disabled={loading}
            onChange={(e) => onUpload(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: 28, marginBottom: 12 }}>📂</div>
          <p className="text-body-sm-strong" style={{ color: 'var(--color-charcoal)', margin: '0 0 4px' }}>
            {loading ? 'Processing…' : 'Click to select a CSV file'}
          </p>
          <p className="text-caption-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
            Accepts .csv · Up to 500 rows displayed
          </p>
        </div>

        {loading && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '100%', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--rounded-full)', height: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '60%',
                  backgroundColor: 'var(--color-accent-blue)',
                  borderRadius: 'var(--rounded-full)',
                  animation: 'indeterminate 1.4s ease-in-out infinite',
                }}
              />
            </div>
            <span className="text-caption-sm" style={{ color: 'var(--color-mute)', whiteSpace: 'nowrap' }}>
              Ranking clients…
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              backgroundColor: 'var(--color-accent-red-soft)',
              border: '1px solid var(--color-accent-red)',
              borderRadius: 'var(--rounded-md)',
              padding: '10px 14px',
            }}
          >
            <p className="text-body-sm" style={{ color: 'var(--color-accent-red)', margin: 0 }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Ranked results */}
      {rows.length > 0 && (
        <div className="feature-card animate-fade-in">
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="text-heading-md" style={{ color: 'var(--color-ink)', margin: '0 0 4px' }}>
                Ranked clients
              </h3>
              <p className="text-body-sm" style={{ color: 'var(--color-mute)', margin: 0 }}>
                {rows.length} rows · sorted highest to lowest probability
              </p>
            </div>
            <span className="badge-pro">{rows.length} rows</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>#</th>
                  {columns.map((col) => <th key={col}>{col}</th>)}
                  <th>Score</th>
                  <th>Band</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--color-stone)', width: 40 }}>{i + 1}</td>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                    ))}
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-charcoal)' }}>
                      {(row.score * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span className={`badge-${row.band.toLowerCase()}`}>
                        {row.band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Utilities ────────────────────────────────────────────────────────
function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default App
