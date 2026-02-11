const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject); 

// Project-scoped task routes (API spec)
router.post('/:projectId/tasks', taskController.createTask);
router.get('/:projectId/tasks', taskController.getTasks);

module.exports = router;