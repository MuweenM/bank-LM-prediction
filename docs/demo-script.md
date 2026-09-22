# Five-minute panel demo

## Before the panel

1. Activate the virtual environment.
2. Build the frontend with `cd frontend && npm run build`.
3. From the repository root, start `python -m uvicorn backend.main:app --port 8000`.
4. Open http://localhost:8000.
5. Use the verified values below from the final model run.

## 0:00-0:30: The problem

**Say:**

> Bank agents have many clients to call and limited time. This tool uses information known before a call to rank who should be contacted first, without using information that only appears after the call.

The model returns a High, Medium, or Low priority. The score ranks clients; it is not a promise that a particular client will subscribe.

## 0:30-1:15: One finding from the analysis

**Say:**

> The analysis found that previous campaign outcome is highly informative. Clients with a previous success were much more likely to subscribe than the overall 11.7% rate, while the model also combines contact channel, campaign history, client information, and balance.

Optional exact analysis result: clients with `poutcome=success`, `housing=no`, and `pdays=90+` subscribed at 70.6% in the association-rule analysis, versus the 11.7% overall rate.

Mention that `duration` is excluded because it is only known after the call and would leak the answer.

## 1:15-2:30: Strong prospect

Open **Score a client** and type this exact final-model example:

| Field | Value |
|---|---|
| Age | `55` |
| Job | `admin.` |
| Marital status | `married` |
| Education | `tertiary` |
| Credit in default | `no` |
| Balance | `5000` |
| Housing loan | `no` |
| Personal loan | `no` |
| Contact channel | `cellular` |
| Month | `may` |
| Planned day of month | `10` |
| Campaign contacts so far | `1` |
| Days since previous campaign | `-1` |
| Previous contacts | `2` |
| Previous campaign outcome | `success` |

Click **Score this client**.

**Expected result to fill in after the final model run:**

- Score: `0.8985` (displayed as 90%)
- Band: `High`
- Message/rate: `52.4% of clients in this band subscribed; overall rate 11.7%`

**Say:**

> This is a strong prospect under the model. The observed subscription rate for the High band was 52.4%, compared with 11.7% across all clients.

## 2:30-3:30: Weak prospect

Reset the form or use a new browser tab. Type this exact final-model example:

| Field | Value |
|---|---|
| Age | `25` |
| Job | `blue-collar` |
| Marital status | `single` |
| Education | `secondary` |
| Credit in default | `no` |
| Balance | `0` |
| Housing loan | `yes` |
| Personal loan | `yes` |
| Contact channel | `unknown` |
| Month | `may` |
| Planned day of month | `20` |
| Campaign contacts so far | `5` |
| Days since previous campaign | `-1` |
| Previous contacts | `0` |
| Previous campaign outcome | `unknown` |

Click **Score this client**.

**Expected result to fill in after the final model run:**

- Score: `0.1372` (displayed as 14%)
- Band: `Low`
- Message/rate: `4.7% of clients in this band subscribed; overall rate 11.7%`

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

Open **Rank a call list** if time allows. Upload `data/raw/bank_marketing.csv` and point out that rows are returned in score order with the score, band, and identifying columns.

## 4:45-5:00: Recommendation

**Say:**

> Use the model as a prioritisation assistant. Start with High-band clients, then Medium, and cover Low-band clients when capacity remains. In the current held-out results, the observed subscription rates are High: 52.4%, Medium: 15.7%, and Low: 4.7%, with an overall rate of 11.7%. These are observed rates from held-out data, not promises about individuals.

Final values after retraining: High `52.4%`, Medium `15.7%`, Low `4.7%`, overall `11.7%`, PR-AUC `0.4638`.
