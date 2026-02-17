const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/db');
const { chatCompletion } = require('../lib/openrouter');

const router = Router();

// Active SSE connections per run
const sseClients = new Map();

function notifySSE(runId, data) {
  const clients = sseClients.get(runId) || [];
  clients.forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

function renderTemplate(template, variables) {
  if (!template) return template;
  let result = template;
  for (const [key, value] of Object.entries(variables || {})) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value));
  }
  return result;
}

router.post('/', async (req, res) => {
  const db = getDb();
  const { promptId, promptVersion, variables, models, systemPrompt, userPrompt, outputSchema } = req.body;

  const renderedSystem = renderTemplate(systemPrompt, variables);
  const renderedUser = renderTemplate(userPrompt, variables);

  const results = models.map(m => ({
    model: m.model,
    output: '',
    structuredOutput: null,
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: 0,
    cost: null,
    error: null,
    status: 'pending',
  }));

  const run = {
    promptId: promptId ? new ObjectId(promptId) : null,
    promptVersion: promptVersion || 1,
    variables: variables || {},
    models,
    results,
    validation: { enabled: false, results: [] },
    createdAt: new Date(),
  };

  const insertResult = await db.collection('runs').insertOne(run);
  run._id = insertResult.insertedId;
  const runId = run._id.toString();

  res.status(201).json(run);

  // Execute in parallel
  const messages = [];
  if (renderedSystem) messages.push({ role: 'system', content: renderedSystem });
  messages.push({ role: 'user', content: renderedUser });

  const promises = models.map(async (m, i) => {
    try {
      // Mark running
      await db.collection('runs').updateOne(
        { _id: run._id },
        { $set: { [`results.${i}.status`]: 'running' } }
      );
      notifySSE(runId, { index: i, status: 'running', model: m.model });

      let responseFormat = null;
      if (outputSchema) {
        responseFormat = { type: 'json_schema', json_schema: { name: 'response', strict: true, schema: outputSchema } };
      }

      const result = await chatCompletion({
        model: m.model,
        messages,
        temperature: m.temperature ?? 0.7,
        maxTokens: m.maxTokens || 4096,
        responseFormat,
        webSearch: m.webSearch,
      });

      let structuredOutput = null;
      if (outputSchema) {
        try { structuredOutput = JSON.parse(result.output); } catch {}
      }

      const update = {
        [`results.${i}.output`]: result.output,
        [`results.${i}.structuredOutput`]: structuredOutput,
        [`results.${i}.tokensIn`]: result.tokensIn,
        [`results.${i}.tokensOut`]: result.tokensOut,
        [`results.${i}.latencyMs`]: result.latencyMs,
        [`results.${i}.cost`]: result.cost,
        [`results.${i}.status`]: 'completed',
      };
      await db.collection('runs').updateOne({ _id: run._id }, { $set: update });
      notifySSE(runId, { index: i, status: 'completed', model: m.model, ...result, structuredOutput });
    } catch (err) {
      const update = {
        [`results.${i}.error`]: err.message,
        [`results.${i}.status`]: 'failed',
      };
      await db.collection('runs').updateOne({ _id: run._id }, { $set: update });
      notifySSE(runId, { index: i, status: 'failed', model: m.model, error: err.message });
    }
  });

  Promise.all(promises).then(() => {
    notifySSE(runId, { done: true });
    setTimeout(() => sseClients.delete(runId), 5000);
  });
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const run = await db.collection('runs').findOne({ _id: new ObjectId(req.params.id) });
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json(run);
});

router.get('/:id/stream', (req, res) => {
  const runId = req.params.id;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');

  if (!sseClients.has(runId)) sseClients.set(runId, []);
  sseClients.get(runId).push(res);

  req.on('close', () => {
    const clients = sseClients.get(runId) || [];
    sseClients.set(runId, clients.filter(c => c !== res));
  });
});

router.get('/', async (req, res) => {
  const db = getDb();
  const filter = {};
  if (req.query.promptId) filter.promptId = new ObjectId(req.query.promptId);
  const runs = await db.collection('runs').find(filter).sort({ createdAt: -1 }).limit(50).toArray();
  res.json(runs);
});

module.exports = router;
