const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const dataFile = path.join(__dirname, '..', 'data', 'tasks.json');
const inputFields = ['title', 'description', 'assignee', 'status', 'priority'];
const storedFields = ['id', ...inputFields, 'createdAt', 'updatedAt'];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = ['pending', 'in-progress', 'completed'];
const priorities = ['low', 'medium', 'high'];
let pendingOperation = Promise.resolve();

function requestError(status, code, message, details) {
  const error = new Error(message);
  Object.assign(error, { status, code, details });
  return error;
}

// Oku–değiştir–yaz bütünü sıraya girer. Bir hata sonraki işlemleri durdurmaz.
function enqueue(operation) {
  const result = pendingOperation.then(operation);
  pendingOperation = result.catch(() => {});
  return result;
}

function validateInput(body, fullUpdate = false) {
  const details = [];
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw requestError(400, 'VALIDATION_ERROR', 'Görev verileri geçersiz.', [
      { field: 'body', message: 'İstek gövdesi bir JSON nesnesi olmalıdır.' },
    ]);
  }

  for (const field of Object.keys(body)) {
    if (!inputFields.includes(field)) {
      details.push({ field, message: field + ' alanı gönderilemez.' });
    }
  }

  const values = {};
  const defaults = { description: '', status: 'pending', priority: 'medium' };
  for (const field of inputFields) {
    if (!Object.hasOwn(body, field)) {
      if (fullUpdate || field === 'title' || field === 'assignee') {
        details.push({ field, message: field + ' alanı zorunludur.' });
      } else {
        values[field] = defaults[field];
      }
      continue;
    }
    if (typeof body[field] !== 'string') {
      details.push({ field, message: field + ' alanı metin olmalıdır.' });
      continue;
    }
    values[field] = ['title', 'description', 'assignee'].includes(field)
      ? body[field].trim() : body[field];
  }

  const limits = { title: [1, 150], description: [0, 2000], assignee: [1, 100] };
  for (const [field, [min, max]] of Object.entries(limits)) {
    if (typeof values[field] === 'string' &&
        (values[field].length < min || values[field].length > max)) {
      details.push({ field, message: field + ' alanı ' + min + '–' + max + ' karakter olmalıdır.' });
    }
  }
  for (const [field, allowed] of [['status', statuses], ['priority', priorities]]) {
    if (typeof values[field] === 'string' && !allowed.includes(values[field])) {
      details.push({ field, message: field + ' şu değerlerden biri olmalıdır: ' + allowed.join(', ') + '.' });
    }
  }
  if (details.length) {
    throw requestError(400, 'VALIDATION_ERROR', 'Görev verileri geçersiz.', details);
  }
  return values;
}

function validateId(id) {
  if (typeof id !== 'string' || !uuidPattern.test(id)) {
    throw requestError(400, 'INVALID_ID', 'Görev kimliği geçerli bir UUID v4 olmalıdır.');
  }
  return id.toLowerCase();
}

function isIsoDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function validateStoredTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('Görev dosyası bir JSON dizisi olmalıdır.');
  const ids = new Set();
  for (const task of tasks) {
    try {
      if (!task || typeof task !== 'object' || Array.isArray(task) ||
          Object.keys(task).length !== storedFields.length ||
          !storedFields.every((field) => Object.hasOwn(task, field))) {
        throw new Error('Eksik veya beklenmeyen alan.');
      }
      const normalized = validateInput(Object.fromEntries(inputFields.map((field) => [field, task[field]])), true);
      if (!inputFields.every((field) => normalized[field] === task[field]) ||
          validateId(task.id) !== task.id || ids.has(task.id) ||
          !isIsoDate(task.createdAt) || !isIsoDate(task.updatedAt)) {
        throw new Error('Geçersiz kayıt veya yinelenen kimlik.');
      }
      ids.add(task.id);
    } catch (cause) {
      // Dosya içindeki geçersiz veri istemci doğrulama hatası değildir: 500 olmalıdır.
      throw new Error('Görev dosyasında geçersiz kayıt var; dosya değiştirilmedi.', { cause });
    }
  }
  return tasks;
}

async function readTasks() {
  const content = await fs.readFile(dataFile, 'utf8');
  return validateStoredTasks(JSON.parse(content));
}

async function writeTasks(tasks) {
  const temporaryFile = dataFile + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporaryFile, JSON.stringify(tasks, null, 2) + '\n', { flag: 'wx' });
    await fs.rename(temporaryFile, dataFile);
  } finally {
    // Başarısız yazmadan kalan dosyayı temizle; asıl hatayı maskeleme.
    try { await fs.unlink(temporaryFile); } catch (error) {
      if (error.code !== 'ENOENT') console.error('Geçici dosya temizlenemedi:', error);
    }
  }
}

function initialize() {
  return enqueue(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    try {
      await fs.writeFile(dataFile, '[]\n', { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    await readTasks();
  });
}

function findTaskIndex(tasks, id) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) throw requestError(404, 'TASK_NOT_FOUND', 'Görev bulunamadı.');
  return index;
}

async function createTask(body) {
  const values = validateInput(body);
  return enqueue(async () => {
    const tasks = await readTasks();
    let id;
    do { id = randomUUID(); } while (tasks.some((task) => task.id === id));
    const now = new Date().toISOString();
    const task = { id, ...values, createdAt: now, updatedAt: now };
    tasks.push(task);
    await writeTasks(tasks);
    return task;
  });
}

function getAllTasks() {
  return enqueue(readTasks);
}

async function getTaskById(id) {
  const normalizedId = validateId(id);
  return enqueue(async () => {
    const tasks = await readTasks();
    return tasks[findTaskIndex(tasks, normalizedId)];
  });
}

async function updateTask(id, body) {
  const normalizedId = validateId(id);
  const values = validateInput(body, true);
  return enqueue(async () => {
    const tasks = await readTasks();
    const index = findTaskIndex(tasks, normalizedId);
    const original = tasks[index];
    const task = { id: original.id, ...values, createdAt: original.createdAt, updatedAt: new Date().toISOString() };
    tasks[index] = task;
    await writeTasks(tasks);
    return task;
  });
}

async function deleteTask(id) {
  const normalizedId = validateId(id);
  return enqueue(async () => {
    const tasks = await readTasks();
    tasks.splice(findTaskIndex(tasks, normalizedId), 1);
    await writeTasks(tasks);
  });
}

module.exports = { initialize, createTask, getAllTasks, getTaskById, updateTask, deleteTask };
