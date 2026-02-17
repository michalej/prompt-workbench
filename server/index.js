const express = require('express');
const cors = require('cors');
const path = require('path');
const { connect } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Auth
if (process.env.AUTH_USER && process.env.AUTH_PASS) {
  const basicAuth = require('express-basic-auth');
  app.use(basicAuth({
    users: { [process.env.AUTH_USER]: process.env.AUTH_PASS },
    challenge: true,
    realm: 'Prompt Workbench',
  }));
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/run', require('./routes/runs'));
app.use('/api/runs', require('./routes/runs'));
app.use('/api/validate', require('./routes/validate'));
app.use('/api/models', require('./routes/models'));

// Serve static frontend in production
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Prompt Workbench server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
