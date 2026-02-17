# Prompt Workbench — Specification

## Overview
A personal prompt engineering tool for building, testing, and iterating on LLM prompts.
Supports multi-model parallel testing, structured output validation, and collaborative AI refinement.

## Tech Stack
- **Frontend**: React (Vite) + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (185.238.72.10, auth required)
- **AI Provider**: OpenRouter (single key, all models)
- **Deploy**: PM2 + nginx on 185.238.74.74
- **Auth**: Basic Auth (same pattern as json-formatter)

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  (Prompt Editor, Model Config, Results) │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────┴────────────────────────┐
│           Express Backend                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Prompts  │ │ Runner   │ │Validator ││
│  │ CRUD     │ │ Engine   │ │ Agent    ││
│  └──────────┘ └──────────┘ └──────────┘│
│       │            │            │       │
│  ┌────┴────┐  ┌────┴────┐            │
│  │ MongoDB │  │OpenRouter│            │
│  └─────────┘  └─────────┘            │
└─────────────────────────────────────────┘
```

## Data Models

### Prompt
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "systemPrompt": "string",
  "userPrompt": "string",  
  "variables": [{ "name": "string", "type": "string|number|array|object", "default": "any", "description": "string" }],
  "outputSchema": "object|null",  // JSON Schema for structured output
  "tags": ["string"],
  "versions": [{
    "version": "number",
    "systemPrompt": "string",
    "userPrompt": "string",
    "outputSchema": "object|null",
    "variables": [],
    "createdAt": "Date",
    "note": "string"
  }],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### TestRun
```json
{
  "_id": "ObjectId",
  "promptId": "ObjectId",
  "promptVersion": "number",
  "variables": { "key": "value" },  // filled-in variables
  "models": [{
    "model": "string",  // e.g. "anthropic/claude-sonnet-4-5-20250929"
    "webSearch": "boolean",
    "temperature": "number",
    "maxTokens": "number"
  }],
  "results": [{
    "model": "string",
    "output": "string",
    "structuredOutput": "object|null",
    "tokensIn": "number",
    "tokensOut": "number",
    "latencyMs": "number",
    "cost": "number|null",
    "error": "string|null",
    "status": "pending|running|completed|failed"
  }],
  "validation": {
    "enabled": "boolean",
    "validatorModel": "string",
    "useSchema": "boolean",
    "results": [{
      "targetModel": "string",
      "passed": "boolean",
      "score": "number",  // 1-10
      "feedback": "string",
      "suggestions": ["string"]
    }]
  },
  "createdAt": "Date"
}
```

### GuildSession
```json
{
  "_id": "ObjectId",
  "promptId": "ObjectId",
  "goal": "string",
  "models": ["string"],  // participating models
  "rounds": [{
    "roundNumber": "number",
    "contributions": [{
      "model": "string",
      "role": "generator|reviewer|synthesizer",
      "content": "string",
      "suggestedPrompt": "string|null"
    }],
    "resultPrompt": "string"  // prompt after this round
  }],
  "createdAt": "Date"
}
```

## API Endpoints

### Prompts
- `GET /api/prompts` — list all prompts
- `POST /api/prompts` — create prompt
- `GET /api/prompts/:id` — get prompt with versions
- `PUT /api/prompts/:id` — update prompt (auto-creates version)
- `DELETE /api/prompts/:id` — delete prompt
- `POST /api/prompts/:id/duplicate` — duplicate prompt

### Test Runs
- `POST /api/run` — execute prompt on selected models (parallel)
- `GET /api/run/:id` — get run results (supports SSE for streaming)
- `GET /api/runs?promptId=x` — list runs for a prompt

### Validation
- `POST /api/validate` — run validator on test results

### Guild
- `POST /api/guild/start` — start guild session
- `GET /api/guild/:id` — get session with all rounds
- `POST /api/guild/:id/next-round` — trigger next refinement round

### Models
- `GET /api/models` — list available OpenRouter models (cached)

## Frontend Pages

### 1. Dashboard (`/`)
- List of saved prompts (cards with name, description, tags, last run date)
- Quick actions: New Prompt, Recent Runs
- Search/filter by tags

### 2. Prompt Editor (`/prompt/:id`)
- **Left panel**: System prompt + User prompt editors (Monaco/CodeMirror-like textarea with syntax highlighting for variables)
- **Variables panel**: Define variables with types and defaults, fill in test values
- **Schema panel**: JSON Schema editor for expected output (toggle on/off)
- **Config bar**: Select models, toggle web search, set temperature
- **Action buttons**: Run Test, Start Guild, Save Version

### 3. Results View (`/prompt/:id/run/:runId`)
- **Side-by-side**: Each model's output in a column
- **Metrics bar**: Latency, tokens, cost per model
- **Validation panel**: Pass/fail per model with feedback
- **Diff view**: Compare outputs between models or between versions

### 4. Guild View (`/prompt/:id/guild/:guildId`)
- Chat-like interface showing model contributions per round
- Current prompt version after each round
- "Next Round" button to continue refinement
- "Accept" to save result as new prompt version

### 5. History (`/prompt/:id/history`)
- Version timeline with diffs
- Click to restore any version
- Compare any two versions side by side

## Key Implementation Details

### OpenRouter Integration
```javascript
// POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "messages": [...],
  "response_format": { "type": "json_schema", "json_schema": {...} },  // if schema defined
  "temperature": 0.7,
  "max_tokens": 4096
}
// Header: Authorization: Bearer $OPENROUTER_API_KEY
```

### Web Search
- For models that support it, pass appropriate plugin/tool config
- OpenRouter handles this per-model

### Validator Agent Prompt
```
You are a prompt output validator. Evaluate the following LLM output.

[If schema mode]: Check if the output matches this JSON schema: {schema}
[Always]: Evaluate quality on these dimensions:
1. Completeness — does it address the full prompt?
2. Accuracy — is the information correct?
3. Format — is it well-structured?
4. Relevance — does it stay on topic?

Return JSON:
{
  "passed": boolean,
  "score": 1-10,
  "feedback": "string",
  "suggestions": ["string"]
}
```

### Guild Orchestration
- Round 1: Generator model creates initial prompt based on goal
- Round 2+: All models review current prompt, suggest improvements
- Synthesizer model combines suggestions into improved version
- User can intervene between rounds

## Environment Variables
```
PORT=3001
MONGODB_URI=mongodb://root:xxx@185.238.72.10:27017/prompt_workbench?authSource=admin
OPENROUTER_API_KEY=sk-or-...
AUTH_USER=michal
AUTH_PASS=xxx
```

## MVP Scope (Phase 1)
1. ✅ Prompt CRUD with versioning
2. ✅ Variable system with template rendering
3. ✅ Multi-model parallel test execution
4. ✅ Side-by-side results with metrics
5. ✅ JSON Schema / structured output support
6. ✅ Validator agent
7. ✅ Basic Auth
8. ✅ Dark/light theme

## Phase 2 (Later)
- Guild of Models (collaborative refinement)
- Langfuse export (with key/secret config)
- Prompt library / sharing
- Multi-user support
- Cost tracking dashboard
- Prompt chains (output of one → input of next)
