const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const multer = require('multer');
const AdmZip = require('adm-zip');

const adapterRegistry = require('./adapters/registry');
const treeBuilder = require('./adapters/tree-builder');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.join(__dirname, 'temp') });

const DIST_PATH = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

// Existing endpoints...
const DATA_DIR = fs.existsSync(path.join(__dirname, 'data'))
  ? path.join(__dirname, 'data')
  : path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Update endpoints to look in data/ instead of ROOT_DIR
app.get('/api/versions', async (req, res) => {
  try {
    const folders = await glob('tokens_v*', { cwd: DATA_DIR });
    res.json(folders.sort().reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tokens/:version', async (req, res) => {
  const { version } = req.params;
  const versionPath = path.join(DATA_DIR, version, 'tokens');
  const searchPath = fs.existsSync(versionPath) ? versionPath : path.join(DATA_DIR, version);

  if (!fs.existsSync(searchPath)) return res.status(404).json({ error: 'Version not found' });

  try {
    const cacheFile = path.join(searchPath, 'vtt-cache.json');
    if (fs.existsSync(cacheFile)) {
      console.log(`[Cache Hit] Returning VTT from ${cacheFile}`);
      const cachedData = await fs.promises.readFile(cacheFile, 'utf-8');
      return res.type('json').send(cachedData);
    }

    const files = await glob('**/*.json', { cwd: searchPath });
    const rawData = {};

    for (const file of files) {
      if (file.includes('node_modules') || file.includes('.git') || file.includes('__MACOSX')) continue;
      const parsedPath = path.parse(file);
      const filename = parsedPath.name;
      if (filename.startsWith('$')) continue;

      let content;
      try {
        content = JSON.parse(fs.readFileSync(path.join(searchPath, file), 'utf-8'));
      } catch (e) { 
        console.error(`[Error] Failed to parse JSON in ${file}:`, e.message);
        continue; 
      }

      if (!content || typeof content !== 'object' || Array.isArray(content)) {
        console.log(`Skipping ${file}: Not an object or is an array`);
        continue;
      }

      const extractedData = adapterRegistry.extract(content, filename);
      treeBuilder.mergeData(rawData, extractedData);
    }

    const finalResult = treeBuilder.build(rawData);
    
    // Save to cache for instant loading next time
    fs.promises.writeFile(cacheFile, JSON.stringify(finalResult), 'utf-8')
      .catch(err => console.error(`[Error] Failed to write cache file:`, err.message));

    res.json(finalResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/import', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send('No file uploaded.');

  try {
    const versionName = `tokens_v${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}`;
    const targetDir = path.join(DATA_DIR, versionName);
    fs.mkdirSync(targetDir, { recursive: true });

    req.files.forEach(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.zip') {
        const zip = new AdmZip(file.path);
        zip.extractAllTo(targetDir, true);
      } else if (ext === '.json' || ext === '.ts') {
        // If it's single flat file, place it in the target directory
        fs.renameSync(file.path, path.join(targetDir, file.originalname));
      }
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });

    res.json({ message: 'Import successful', version: versionName });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process import: ' + err.message });
  }
});

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(DIST_PATH, 'index.html'))) {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running at ${url}`);

  // Auto-open browser in production
  if (fs.existsSync(DIST_PATH)) {
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${start} ${url}`);
  }
});
