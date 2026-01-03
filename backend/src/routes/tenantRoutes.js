const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const userController = require('../controllers/userController'); // Import userController
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', tenantController.listTenants);
router.get('/:id', tenantController.getTenant);
router.put('/:id', tenantController.updateTenant);

// --- ALIAS ROUTES to satisfy API Spec Requirement ---
// POST /api/tenants/:tenantId/users
router.post('/:tenantId/users', userController.createUser);
// GET /api/tenants/:tenantId/users
router.get('/:tenantId/users', userController.listUsers);
// ----------------------------------------------------

module.exports = router;