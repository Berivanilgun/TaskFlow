const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

const projectRoot = path.resolve(__dirname, '..', '..');

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function createServer(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskflow-test-'));
  const source = path.join(directory, 'src');
  const dataFile = path.join(source, 'data', 'tasks.json');
  const marker = path.join(directory, 'fail-write');
  const originalFile = path.join(projectRoot, 'src', 'data', 'tasks.json');
  const original = await fs.readFile(originalFile, 'utf8');
  let child;
  let baseUrl;
  let logs = '';
  let errors = '';
  let requestCount = 0;

  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => {
        child.once('exit', resolve);
        child.kill();
      });
    }
  }

  t.after(async () => {
    await stop();
    t.diagnostic('Gerçek HTTP isteği: ' + requestCount);
    try {
      assert.equal(await fs.readFile(originalFile, 'utf8'), original, 'Asıl görev dosyası değişmemeli.');
    } finally {
      // Yalnızca bu test için oluşturulan geçici dizin silinir.
      const resolved = path.resolve(directory);
      assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
      assert.ok(path.basename(resolved).startsWith('taskflow-test-'));
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });

  await fs.cp(path.join(projectRoot, 'src'), source, { recursive: true });
  await fs.writeFile(dataFile, '[]\n');
  // Üretim kodunu değiştirmeden, yalnızca test sürecinde rename arızası oluşturur.
  const hook = path.join(directory, 'fault-hook.cjs');
  await fs.writeFile(hook, [
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    "const originalRename = fs.promises.rename;",
    "fs.promises.rename = async (...args) => {",
    "  if (fs.existsSync(path.join(__dirname, 'fail-write'))) {",
    "    const error = new Error('Test tarafından enjekte edilen yazma arızası.');",
    "    error.code = 'EACCES'; throw error;",
    "  }",
    "  return originalRename(...args);",
    "};",
  ].join('\n'));

  async function start({ expectFailure = false } = {}) {
    const port = await freePort();
    baseUrl = 'http://127.0.0.1:' + port;
    const previousErrors = errors.length;
    child = spawn(process.execPath, ['--require', hook, path.join(source, 'server.js')], {
      cwd: directory,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_PATH: [path.join(projectRoot, 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Test sunucusu başlangıç zaman aşımı: ' + errors.slice(previousErrors)));
      }, 10000);
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        logs += text;
        output += text;
        if (!expectFailure && output.includes('adresinde dinleniyor.')) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.stderr.on('data', (chunk) => { errors += chunk.toString(); });
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
      child.once('exit', (code) => {
        clearTimeout(timer);
        if (expectFailure && code === 1) resolve();
        else reject(new Error('Beklenmeyen sunucu çıkışı: ' + code + ' ' + errors.slice(previousErrors)));
      });
    });
    if (expectFailure) assert.match(errors.slice(previousErrors), /Sunucu başlatılamadı/);
  }

  async function request(method, url, expectedStatus, body, expectedCode, headers = { 'Content-Type': 'application/json' }) {
    requestCount++;
    const response = await fetch(baseUrl + url, {
      method, headers,
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
      signal: AbortSignal.timeout(5000),
    });
    const text = await response.text();
    assert.equal(response.status, expectedStatus, method + ' ' + url + ': ' + text);
    if (expectedStatus === 204) {
      assert.equal(text, '', '204 yanıtı gövdesiz olmalı.');
      return { response, body: null };
    }
    assert.match(response.headers.get('content-type'), /application\/json/);
    const result = JSON.parse(text);
    if (expectedCode) assert.equal(result.error.code, expectedCode);
    return { response, body: result };
  }

  return {
    start, stop, request, dataFile,
    get baseUrl() { return baseUrl; },
    get logs() { return logs; },
    get requestCount() { return requestCount; },
    failWrites: () => fs.writeFile(marker, 'fail'),
    restoreWrites: () => fs.unlink(marker),
  };
}

module.exports = { createServer, projectRoot };
