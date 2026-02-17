const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/db');

const router = Router();

router.get('/', async (req, res) => {
  const db = getDb();
  const prompts = await db.collection('prompts')
    .find({}, { projection: { versions: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
  res.json(prompts);
});

router.post('/', async (req, res) => {
  const db = getDb();
  const { name, description, systemPrompt, userPrompt, variables, outputSchema, tags } = req.body;
  const now = new Date();
  const doc = {
    name: name || 'Untitled Prompt',
    description: description || '',
    systemPrompt: systemPrompt || '',
    userPrompt: userPrompt || '',
    variables: variables || [],
    outputSchema: outputSchema || null,
    tags: tags || [],
    versions: [{
      version: 1,
      systemPrompt: systemPrompt || '',
      userPrompt: userPrompt || '',
      outputSchema: outputSchema || null,
      variables: variables || [],
      createdAt: now,
      note: 'Initial version',
    }],
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection('prompts').insertOne(doc);
  doc._id = result.insertedId;
  res.status(201).json(doc);
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const prompt = await db.collection('prompts').findOne({ _id: new ObjectId(req.params.id) });
  if (!prompt) return res.status(404).json({ error: 'Not found' });
  res.json(prompt);
});

router.put('/:id', async (req, res) => {
  const db = getDb();
  const id = new ObjectId(req.params.id);
  const existing = await db.collection('prompts').findOne({ _id: id });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, description, systemPrompt, userPrompt, variables, outputSchema, tags, versionNote } = req.body;
  const now = new Date();
  const nextVersion = (existing.versions?.length || 0) + 1;

  const newVersion = {
    version: nextVersion,
    systemPrompt: systemPrompt ?? existing.systemPrompt,
    userPrompt: userPrompt ?? existing.userPrompt,
    outputSchema: outputSchema !== undefined ? outputSchema : existing.outputSchema,
    variables: variables ?? existing.variables,
    createdAt: now,
    note: versionNote || `Version ${nextVersion}`,
  };

  const update = {
    $set: {
      name: name ?? existing.name,
      description: description ?? existing.description,
      systemPrompt: systemPrompt ?? existing.systemPrompt,
      userPrompt: userPrompt ?? existing.userPrompt,
      variables: variables ?? existing.variables,
      outputSchema: outputSchema !== undefined ? outputSchema : existing.outputSchema,
      tags: tags ?? existing.tags,
      updatedAt: now,
    },
    $push: { versions: newVersion },
  };

  await db.collection('prompts').updateOne({ _id: id }, update);
  const updated = await db.collection('prompts').findOne({ _id: id });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const db = getDb();
  await db.collection('prompts').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

router.post('/:id/duplicate', async (req, res) => {
  const db = getDb();
  const original = await db.collection('prompts').findOne({ _id: new ObjectId(req.params.id) });
  if (!original) return res.status(404).json({ error: 'Not found' });

  const now = new Date();
  delete original._id;
  original.name = `${original.name} (copy)`;
  original.versions = [{
    version: 1,
    systemPrompt: original.systemPrompt,
    userPrompt: original.userPrompt,
    outputSchema: original.outputSchema,
    variables: original.variables,
    createdAt: now,
    note: 'Duplicated',
  }];
  original.createdAt = now;
  original.updatedAt = now;

  const result = await db.collection('prompts').insertOne(original);
  original._id = result.insertedId;
  res.status(201).json(original);
});

module.exports = router;
