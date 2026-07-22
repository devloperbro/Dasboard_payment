const express = require('express');
const router = express.Router();
const { listProviders, updateProvider, activateProvider, deactivateProvider } = require('../controllers/paymentProvider.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// All provider routes require admin auth
router.use(auth, authorize('admin'));

router.get('/', listProviders);
router.put('/:name', updateProvider);
router.post('/:name/activate', activateProvider);
router.post('/:name/deactivate', deactivateProvider);

module.exports = router;
