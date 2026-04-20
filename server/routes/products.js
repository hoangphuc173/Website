const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getAll);
router.get('/lines', ctrl.getProductLines);
router.get('/:id', ctrl.getById);

module.exports = router;
