# Five-minute panel demo

## Before the panel

1. Activate the virtual environment.
2. Build the frontend with `cd frontend && npm run build`.
3. From the repository root, start `python -m uvicorn backend.main:app --port 8000`.
4. Open http://localhost:8000.
5. Replace every `[FILL IN]` value below with the exact values and results from the final model run.

## 0:00-0:30: The problem

**Say:**

> Bank agents have many clients to call and limited time. This tool uses information known before a call to rank who should be contacted first, without using information that only appears after the call.

The model returns a High, Medium, or Low priority. The score ranks clients; it is not a promise that a particular client will subscribe.

## 0:30-1:15: One finding from the analysis

**Say:**

> The analysis found that previous campaign outcome is highly informative. Clients with a previous success were much more likely to subscribe than the overall 11.7% rate, while the model also combines contact channel, campaign history, client information, and balance.

Optional exact analysis result: `[FILL IN: one concise finding and its measured rate]`.

Mention that `duration` is excluded because it is only known after the call and would leak the answer.

## 1:15-2:30: Strong prospect

Open **Score a client** and type this exact final-model example:

| Field | Value |
|---|---|
| Age | `[FILL IN]` |
| Job | `[FILL IN]` |
| Marital status | `[FILL IN]` |
| Education | `[FILL IN]` |
| Credit in default | `[FILL IN]` |
| Balance | `[FILL IN]` |
| Housing loan | `[FILL IN]` |
| Personal loan | `[FILL IN]` |
| Contact channel | `[FILL IN]` |
| Month | `[FILL IN]` |
| Planned day of month | `[FILL IN]` |
| Campaign contacts so far | `[FILL IN]` |
| Days since previous campaign | `[FILL IN]` |
| Previous contacts | `[FILL IN]` |
| Previous campaign outcome | `[FILL IN]` |

Click **Score this client**.

**Expected result to fill in after the final model run:**

- Score: `[FILL IN]`
- Band: `[FILL IN: ideally High]`
- Message/rate: `[FILL IN]`

**Say:**

> This is a strong prospect under the model. The observed subscription rate for the `[FILL IN]` band was `[FILL IN]%`, compared with `[FILL IN]%` across all clients.

## 2:30-3:30: Weak prospect

Reset the form or use a new browser tab. Type this exact final-model example:

| Field | Value |
|---|---|
| Age | `[FILL IN]` |
| Job | `[FILL IN]` |
| Marital status | `[FILL IN]` |
| Education | `[FILL IN]` |
| Credit in default | `[FILL IN]` |
| Balance | `[FILL IN]` |
| Housing loan | `[FILL IN]` |
| Personal loan | `[FILL IN]` |
| Contact channel | `[FILL IN]` |
| Month | `[FILL IN]` |
| Planned day of month | `[FILL IN]` |
| Campaign contacts so far | `[FILL IN]` |
| Days since previous campaign | `[FILL IN]` |
| Previous contacts | `[FILL IN]` |
| Previous campaign outcome | `[FILL IN]` |

Click **Score this client**.

**Expected result to fill in after the final model run:**

- Score: `[FILL IN]`
- Band: `[FILL IN: ideally Low]`
- Message/rate: `[FILL IN]`

**Say:**

> This is a lower-priority prospect under the model. It is not a rejection; it helps the team decide who to call later when higher-priority leads are covered.

## 3:30-4:00: Show an input mistake

Use the strong-prospect values, then enter an invalid value:

- Age: `17` (the allowed range starts at 18), or
- Days since previous campaign: `-2` (the allowed minimum is -1).

Click **Score this client**.

**Say:**

> The form catches the mistake before sending the request. It tells the agent exactly which field needs correcting, so invalid values do not silently reach the model.

Expected message: `Enter a value from 18 to 100.` or `Enter a value from -1 to 900.`

## 4:00-4:45: Explainability tabs

Open **What drives subscriptions**.

Point to one rule and say:

> This rule is an association, not a guarantee. Support tells us how common the group was, confidence tells us the observed subscription rate in the group, and lift compares that rate with the overall baseline.

Show the decision-tree text and mention that the association-rule notebook also compared Apriori with FP-Growth.

Open **Rank a call list** if time allows. Upload `[FILL IN: CSV filename]` and point out that rows are returned in score order with the score, band, and identifying columns.

## 4:45-5:00: Recommendation

**Say:**

> Use the model as a prioritisation assistant. Start with High-band clients, then Medium, and cover Low-band clients when capacity remains. In the current held-out results, the observed subscription rates are approximately High: 50.4%, Medium: 15.2%, and Low: 5.2%, with an overall rate of 11.7%. These are observed rates from held-out data, not promises about individuals.

Final values to confirm after retraining: High `[FILL IN]%`, Medium `[FILL IN]%`, Low `[FILL IN]%`, overall `[FILL IN]%`, PR-AUC `[FILL IN]`.
