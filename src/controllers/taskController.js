const taskService = require('../services/taskService');

// Express 5, async fonksiyonlardan gelen hataları merkezi middleware'e iletir.
async function createTask(req, res) {
  const task = await taskService.createTask(req.body);
  return res.location('/tasks/' + task.id).status(201).json(task);
}

async function getAllTasks(req, res) {
  return res.status(200).json(await taskService.getAllTasks());
}

async function getTaskById(req, res) {
  return res.status(200).json(await taskService.getTaskById(req.params.id));
}

async function updateTask(req, res) {
  return res.status(200).json(await taskService.updateTask(req.params.id, req.body));
}

async function deleteTask(req, res) {
  await taskService.deleteTask(req.params.id);
  return res.status(204).end();
}

module.exports = { createTask, getAllTasks, getTaskById, updateTask, deleteTask };
