const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/statisticsController');

router.get('/overview', ctrl.getOverview);
router.get('/revenue-by-customer', ctrl.revenueByCustomer);
router.get('/revenue-by-time', ctrl.revenueByTime);
router.get('/revenue-by-product', ctrl.revenueByProduct);
router.get('/revenue-by-country', ctrl.revenueByCountry);
router.get('/order-status', ctrl.orderStatus);
router.get('/pivot-data', ctrl.pivotData);
router.get('/years', ctrl.getYears);

module.exports = router;
