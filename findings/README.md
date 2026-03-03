`# Findings Folder

This folder stores all endpoint-discovery knowledge collected while probing Danella-X before building the API.

## Structure

- `discovery-log.md`: human-readable running notes from each probe run.
- `endpoint-behavior.md`: curated conclusions about endpoint contracts/behaviors.
- `runs/*.json`: raw structured artifacts per run (statuses, headers summary, cookie names, body shape, previews).

## Rule for this project

Every time we discover useful behavior, we persist it here:

- auth behavior (`__RequestVerificationToken`, redirects, cookie names)
- task endpoint behavior (status codes, response shape, content types)
- deviations or anomalies (missing cookies, HTML instead of JSON, auth failures)
- any field names needed for future API implementation

## Run command

```bash
npm run probe:auth-task
```

The script prints to console and appends findings automatically.
