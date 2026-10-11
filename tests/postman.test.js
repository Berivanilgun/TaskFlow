const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Script } = require('node:vm');
const { createServer, projectRoot } = require('./helpers/server');

const collectionFile = path.join(projectRoot, 'postman', 'TaskFlow.postman_collection.json');

test('Postman koleksiyonu: JSON yapısı, değişkenler ve betik sözdizimi', async () => {
  const collection = JSON.parse(await fs.readFile(collectionFile, 'utf8'));
  assert.equal(collection.info.schema, 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
  assert.equal(collection.item.length, 11);
  const variables = Object.fromEntries(collection.variable.map((variable) => [variable.key, variable.value]));
  assert.equal(variables.baseUrl, 'http://localhost:3000');
  assert.equal(variables.taskId, '');
  assert.equal(variables.createdAt, '');
  for (const item of collection.item) {
    assert.ok(item.request.url.raw.startsWith('{{baseUrl}}/tasks'));
    assert.ok(item.event.some((event) => event.listen === 'test'));
    assert.deepEqual(item.response, [], 'Çalıştırılmamış yanıtlar gerçek sonuç gibi saklanmamalı.');
    for (const event of item.event) new Script(event.script.exec.join('\n'), { filename: item.name });
  }
  for (const index of [0, 3, 6, 7]) JSON.parse(collection.item[index].request.body.raw);
  assert.throws(() => JSON.parse(collection.item[10].request.body.raw));
});

test('Postman örneklerinin 11 isteği gerçek HTTP ile beklenen sonuçları verir', async (t) => {
  // Bu test Postman uygulamasını veya pm.* test motorunu çalıştırmaz.
  const collection = JSON.parse(await fs.readFile(collectionFile, 'utf8'));
  const server = await createServer(t);
  await server.start();
  const variables = { baseUrl: server.baseUrl, taskId: '', createdAt: '' };
  const statuses = [201, 200, 200, 200, 204, 404, 400, 400, 400, 404, 400];
  const codes = [undefined, undefined, undefined, undefined, undefined, 'TASK_NOT_FOUND', 'VALIDATION_ERROR', 'VALIDATION_ERROR', 'INVALID_ID', 'TASK_NOT_FOUND', 'INVALID_JSON'];
  let original;
  for (const [index, item] of collection.item.entries()) {
    const url = item.request.url.raw.replace(/{{(\w+)}}/g, (_, key) => {
      assert.ok(variables[key], 'Çözülemeyen koleksiyon değişkeni: ' + key);
      return variables[key];
    });
    const headers = Object.fromEntries(item.request.header.map(({ key, value }) => [key, value]));
    const result = await server.request(item.request.method, url.slice(server.baseUrl.length), statuses[index], item.request.body?.raw, codes[index], headers);
    if (index === 0) {
      original = result.body;
      variables.taskId = original.id;
      variables.createdAt = original.createdAt;
      assert.equal(result.response.headers.get('location'), '/tasks/' + original.id);
      const expected = JSON.parse(item.request.body.raw);
      for (const key of Object.keys(expected)) assert.equal(original[key], expected[key]);
    }
    if (index === 1) assert.ok(result.body.some((task) => task.id === variables.taskId));
    if (index === 2) assert.deepEqual(result.body, original);
    if (index === 3) {
      assert.equal(result.body.id, variables.taskId);
      assert.equal(result.body.createdAt, variables.createdAt);
      const expected = JSON.parse(item.request.body.raw);
      for (const key of Object.keys(expected)) assert.equal(result.body[key], expected[key]);
    }
  }
  assert.deepEqual(JSON.parse(await fs.readFile(server.dataFile, 'utf8')), []);
  assert.equal(server.requestCount, 11);
});
