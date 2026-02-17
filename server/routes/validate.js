const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/db');
const { chatCompletion } = require('../lib/openrouter');

const router = Router();

router.post('/', async (req, res) => {
  const { runId, targetIndices, validatorModel, schema } = req.body;
  const db = getDb();
  const run = await db.collection('runs').findOne({ _id: new ObjectId(runId) });
  if (!run) return res.status(404).json({ error: 'Run not found' });

  const indices = targetIndices || run.results.map((_, i) => i);
  const model = validatorModel || 'anthropic/claude-haiku-4-5-20251001';

  const validationResults = await Promise.all(indices.map(async (i) => {
    const r = run.results[i];
    if (!r || r.status !== 'completed') return null;

    const schemaSection = schema
      ? `\nCheck if the output matches this JSON schema:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n`
      : '';

    const prompt = `You are a prompt output validator. Evaluate the following LLM output.
${schemaSection}
Evaluate quality on these dimensions:
1. Completeness — does it address the full prompt?
2. Accuracy — is the information correct?
3. Format — is it well-structured?
4. Relevance — does it stay on topic?

The original prompt was:
System: ${run.models[i]?.model || 'unknown'}
Variables: ${JSON.stringify(run.variables)}

The output to evaluate:
\`\`\`
${r.output}
\`\`\`

Return ONLY valid JSON:
{"passed": boolean, "score": number_1_to_10, "feedback": "string", "suggestions": ["string"]}`;

    try {
      const result = await chatCompletion({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        maxTokens: 1024,
        responseFormat: { type: 'json_object' },
      });

      let parsed;
      try { parsed = JSON.parse(result.output); } catch { parsed = { passed: false, score: 0, feedback: result.output, suggestions: [] }; }

      return { targetModel: r.model, ...parsed };
    } catch (err) {
      return { targetModel: r.model, passed: false, score: 0, feedback: `Validation error: ${err.message}`, suggestions: [] };
    }
  }));

  const filtered = validationResults.filter(Boolean);
  await db.collection('runs').updateOne(
    { _id: run._id },
    { $set: { 'validation.enabled': true, 'validation.validatorModel': model, 'validation.results': filtered } }
  );

  res.json({ results: filtered });
});

module.exports = router;
