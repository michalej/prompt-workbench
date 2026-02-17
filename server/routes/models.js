const { Router } = require('express');
const { listModels } = require('../lib/openrouter');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const models = await listModels();
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
