const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createServer } = require('./helpers/server');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const missingId = '11111111-1111-4111-8111-111111111111';
const fullTask = { title: 'Güncel görev', description: '', assignee: 'Ayşe', status: 'completed', priority: 'high' };

function validTask(task) {
  assert.deepEqual(Object.keys(task).sort(), ['id', 'title', 'description', 'assignee', 'status', 'priority', 'createdAt', 'updatedAt'].sort());
  assert.match(task.id, uuid);
  for (const key of ['createdAt', 'updatedAt']) assert.equal(new Date(task[key]).toISOString(), task[key]);
}

function assertLogs(server) {
  const lines = server.logs.split(/\r?\n/).filter((line) => /^\[/.test(line));
  assert.equal(lines.length, server.requestCount, 'Her HTTP isteği için bir kayıt olmalı.');
  for (const line of lines) assert.match(line, /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] [A-Z]+ \/.*$/);
}

test('Beş CRUD endpoint: 201/200/204, Location, tam PUT ve 404', async (t) => {
  const server = await createServer(t);
  await server.start();
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, []);
  const { response, body: created } = await server.request('POST', '/tasks', 201, { title: '  İlk görev  ', assignee: '  Berivan  ' });
  validTask(created);
  assert.equal(response.headers.get('location'), '/tasks/' + created.id);
  assert.equal(created.title, 'İlk görev');
  assert.equal(created.assignee, 'Berivan');
  assert.equal(created.description, '');
  assert.equal(created.status, 'pending');
  assert.equal(created.priority, 'medium');
  assert.equal(created.createdAt, created.updatedAt);
  assert.deepEqual(JSON.parse(await fs.readFile(server.dataFile, 'utf8')), [created]);
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, [created]);
  assert.deepEqual((await server.request('GET', '/tasks/' + created.id.toUpperCase(), 200)).body, created);
  const updated = (await server.request('PUT', '/tasks/' + created.id, 200, fullTask)).body;
  validTask(updated);
  for (const key of Object.keys(fullTask)) assert.equal(updated[key], fullTask[key]);
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
  assert.ok(Date.parse(updated.updatedAt) >= Date.parse(created.updatedAt));
  await server.request('DELETE', '/tasks/' + created.id, 204);
  await server.request('GET', '/tasks/' + created.id, 404, undefined, 'TASK_NOT_FOUND');
  await server.request('DELETE', '/tasks/' + created.id, 404, undefined, 'TASK_NOT_FOUND');
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, []);
  assert.deepEqual(JSON.parse(await fs.readFile(server.dataFile, 'utf8')), []);
  assertLogs(server);
});

test('Doğrulama: geçersiz veri ve eksik PUT 400; mevcut veri değişmez', async (t) => {
  const server = await createServer(t);
  await server.start();
  const created = (await server.request('POST', '/tasks', 201, fullTask)).body;
  const before = await fs.readFile(server.dataFile, 'utf8');
  const invalidBodies = [
    {}, null, [], 5, '"metin"',
    { title: ' ', assignee: 'B' }, { title: 'A', assignee: 9 },
    { title: 'A', assignee: 'B', priority: 'urgent' },
    { title: 'A', assignee: 'B', status: 'Pending' },
    { title: 'A', assignee: 'B', description: null },
    { title: 'A', assignee: 'B', id: created.id },
    { title: 'A', assignee: 'B', createdAt: created.createdAt },
    { title: 'A', assignee: 'B', updatedAt: created.updatedAt },
    { title: 'A', assignee: 'B', extra: true },
    { title: 'x'.repeat(151), assignee: 'B' },
    { title: 'A', assignee: 'x'.repeat(101) },
    { title: 'A', assignee: 'B', description: 'x'.repeat(2001) },
  ];
  for (const body of invalidBodies) {
    const result = (await server.request('POST', '/tasks', 400, body, 'VALIDATION_ERROR')).body;
    assert.ok(Array.isArray(result.error.details) && result.error.details.length);
  }
  for (const field of Object.keys(fullTask)) {
    const body = { ...fullTask };
    delete body[field];
    await server.request('PUT', '/tasks/' + created.id, 400, body, 'VALIDATION_ERROR');
  }
  await server.request('PUT', '/tasks/' + created.id, 400, { status: 'completed' }, 'VALIDATION_ERROR');
  await server.request('PUT', '/tasks/' + missingId, 400, { status: 'completed' }, 'VALIDATION_ERROR');
  for (const method of ['GET', 'PUT', 'DELETE']) {
    await server.request(method, '/tasks/bad-id', 400, method === 'PUT' ? fullTask : undefined, 'INVALID_ID');
    await server.request(method, '/tasks/' + missingId, 404, method === 'PUT' ? fullTask : undefined, 'TASK_NOT_FOUND');
  }
  assert.equal(await fs.readFile(server.dataFile, 'utf8'), before);
  assertLogs(server);
});

test('JSON, Content-Type, kodlama, boyut ve bilinmeyen route hataları', async (t) => {
  const server = await createServer(t);
  await server.start();
  await server.request('POST', '/tasks', 400, '{', 'INVALID_JSON');
  await server.request('POST', '/tasks', 400, 'x'.repeat(102401), 'PAYLOAD_TOO_LARGE');
  await server.request('POST', '/tasks', 400, 'abc', 'INVALID_CONTENT_TYPE', { 'Content-Type': 'text/plain' });
  await server.request('POST', '/tasks', 400, undefined, 'INVALID_CONTENT_TYPE', {});
  await server.request('POST', '/tasks', 400, undefined, 'VALIDATION_ERROR');
  await server.request('POST', '/tasks', 400, '{}', 'INVALID_REQUEST', { 'Content-Type': 'application/json; charset=bogus' });
  await server.request('POST', '/tasks', 400, '{}', 'INVALID_REQUEST', { 'Content-Type': 'application/json', 'Content-Encoding': 'bogus' });
  await server.request('GET', '/unknown', 404, undefined, 'ROUTE_NOT_FOUND');
  await server.request('PATCH', '/tasks/' + missingId, 404, {}, 'ROUTE_NOT_FOUND');
  await server.request('GET', '/tasks?kontrol=logger', 200);
  assert.ok(server.logs.includes('GET /tasks?kontrol=logger'));
  assert.deepEqual(JSON.parse(await fs.readFile(server.dataFile, 'utf8')), []);
  assertLogs(server);
});

test('Gerçek sunucu yeniden başlatmalarında oluşturma, güncelleme ve silme kalıcıdır', async (t) => {
  const server = await createServer(t);
  await server.start();
  const created = (await server.request('POST', '/tasks', 201, { title: 'Kalıcı görev', assignee: 'Berivan' })).body;
  await server.stop();
  await server.start();
  assert.deepEqual((await server.request('GET', '/tasks/' + created.id, 200)).body, created);
  const updated = (await server.request('PUT', '/tasks/' + created.id, 200, fullTask)).body;
  await server.stop();
  await server.start();
  assert.deepEqual((await server.request('GET', '/tasks/' + created.id, 200)).body, updated);
  await server.request('DELETE', '/tasks/' + created.id, 204);
  await server.stop();
  await server.start();
  await server.request('GET', '/tasks/' + created.id, 404, undefined, 'TASK_NOT_FOUND');
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, []);
  assertLogs(server);
});

test('Eşzamanlı oluşturma ve PUT/DELETE veri kaybetmez', async (t) => {
  const server = await createServer(t);
  await server.start();
  const created = await Promise.all(Array.from({ length: 12 }, (_, i) =>
    server.request('POST', '/tasks', 201, { title: 'Paralel ' + i, assignee: 'Ekip' })));
  const list = (await server.request('GET', '/tasks', 200)).body;
  assert.equal(list.length, 12);
  assert.equal(new Set(list.map((task) => task.id)).size, 12);
  await Promise.all(created.map(({ body }, i) => i % 2
    ? server.request('DELETE', '/tasks/' + body.id, 204)
    : server.request('PUT', '/tasks/' + body.id, 200, { ...fullTask, title: 'Yeni ' + i })));
  const final = (await server.request('GET', '/tasks', 200)).body;
  assert.equal(final.length, 6);
  assert.ok(final.every((task) => task.title.startsWith('Yeni ')));
  assert.deepEqual(JSON.parse(await fs.readFile(server.dataFile, 'utf8')), final);
  assertLogs(server);
});

test('Dosya okuma ve şema hataları güvenli 500 verir; bozuk veri ezilmez', async (t) => {
  const server = await createServer(t);
  await server.start();
  const task = (await server.request('POST', '/tasks', 201, fullTask)).body;
  const invalidFiles = ['{bad', '{}', JSON.stringify([{ ...task, priority: 'urgent' }]), JSON.stringify([task, task]), JSON.stringify([{ ...task, createdAt: 'invalid' }])];
  for (const content of invalidFiles) {
    await fs.writeFile(server.dataFile, content);
    const result = (await server.request('GET', '/tasks', 500, undefined, 'INTERNAL_SERVER_ERROR')).body;
    assert.deepEqual(result, { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Sunucu hatası oluştu.' } });
    await server.request('POST', '/tasks', 500, fullTask, 'INTERNAL_SERVER_ERROR');
    assert.equal(await fs.readFile(server.dataFile, 'utf8'), content);
  }
  await fs.unlink(server.dataFile);
  await server.request('GET', '/tasks', 500, undefined, 'INTERNAL_SERVER_ERROR');
  await fs.writeFile(server.dataFile, '[]\n');
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, []);
  assertLogs(server);
});

test('Enjekte edilen yazma arızasında POST/PUT/DELETE başarısız; veri ve kuyruk korunur', async (t) => {
  const server = await createServer(t);
  await server.start();
  const task = (await server.request('POST', '/tasks', 201, fullTask)).body;
  const before = await fs.readFile(server.dataFile, 'utf8');
  await server.failWrites();
  await server.request('POST', '/tasks', 500, fullTask, 'INTERNAL_SERVER_ERROR');
  await server.request('PUT', '/tasks/' + task.id, 500, { ...fullTask, title: 'Kaydedilemeyen' }, 'INTERNAL_SERVER_ERROR');
  await server.request('DELETE', '/tasks/' + task.id, 500, undefined, 'INTERNAL_SERVER_ERROR');
  assert.equal(await fs.readFile(server.dataFile, 'utf8'), before);
  assert.ok(!(await fs.readdir(path.dirname(server.dataFile))).some((name) => name.endsWith('.tmp')));
  await server.restoreWrites();
  await server.request('POST', '/tasks', 201, fullTask);
  assert.equal((await server.request('GET', '/tasks', 200)).body.length, 2);
  assertLogs(server);
});

test('Başlangıçta eksik dosya oluşturulur; bozuk dosya ile sunucu açılmaz', async (t) => {
  const server = await createServer(t);
  await fs.unlink(server.dataFile);
  await server.start();
  assert.deepEqual((await server.request('GET', '/tasks', 200)).body, []);
  await server.stop();
  for (const content of ['{broken', '{}']) {
    await fs.writeFile(server.dataFile, content);
    await server.start({ expectFailure: true });
    assert.equal(await fs.readFile(server.dataFile, 'utf8'), content);
  }
});
