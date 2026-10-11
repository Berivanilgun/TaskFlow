const express = require('express');
const taskController = require('../controllers/taskController');
const requireJson = require('../middleware/requireJson');

const router = express.Router();

router.post('/', requireJson, taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', requireJson, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
