const fs = require('fs');
const path = require('path');

function readDb() {
  const dbPath = path.join(process.cwd(), 'db.json');
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

module.exports = function handler(req, res) {
  const resource = req.query.resource;

  if (!resource || typeof resource !== 'string') {
    res.status(400).json({ error: 'Missing resource' });
    return;
  }

  let db;
  try {
    db = readDb();
  } catch {
    res.status(500).json({ error: 'Failed to read database' });
    return;
  }

  if (req.method === 'GET') {
    if (!(resource in db)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(db[resource]);
    return;
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const id = body.id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    res.status(201).json({ ...body, id });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
};
