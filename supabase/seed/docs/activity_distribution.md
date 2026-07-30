# Activity distribution (dashboard sanity)

Users are bucketed so analytics look organic on day one:

| Bucket             | Count | Meaning                                |
|--------------------|-------|-----------------------------------------|
| Active today       | 25    | Last login < 24h                        |
| Active this week   | 80    | Last login 1–6 days                     |
| Active this month  | 180 (\* actually 175 after bucket trim) | Last login 7–30 days |
| Inactive > 90 days | 20    | Last login > 90 days                    |
| **Production Ready** | 15  | 3 elites (900+) + 12 (850–899)          |

\* We trim 5 slots from the monthly bucket so the totals sum to 300.

Talent-score buckets:

| Range      | Count |
|------------|-------|
| 900+       | 3     |
| 850–899    | 12    |
| 700–849    | 60    |
| 500–699    | 110   |
| 300–499    | 80    |
| < 300      | 35    |
