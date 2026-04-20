const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { Customer, Order, OrderDetail, Product, ProductLine, Payment } = require('../models');

// GET /api/stats/overview - Tổng quan dashboard
exports.getOverview = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();

    const revenueResult = await OrderDetail.findOne({
      attributes: [[fn('SUM', literal('quantityOrdered * priceEach')), 'totalRevenue']]
    });

    const totalPayments = await Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'totalPayments']]
    });

    res.json({
      totalCustomers,
      totalOrders,
      totalProducts,
      totalRevenue: revenueResult?.dataValues?.totalRevenue || 0,
      totalPayments: totalPayments?.dataValues?.totalPayments || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/revenue-by-customer - Doanh thu theo khách hàng
exports.revenueByCustomer = async (req, res) => {
  try {
    const { limit = 20, sort = 'DESC' } = req.query;

    const results = await sequelize.query(`
      SELECT 
        c.customerNumber,
        c.customerName,
        c.country,
        c.city,
        COUNT(DISTINCT o.orderNumber) as totalOrders,
        SUM(od.quantityOrdered * od.priceEach) as totalRevenue,
        SUM(od.quantityOrdered) as totalQuantity
      FROM customers c
      JOIN orders o ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      GROUP BY c.customerNumber, c.customerName, c.country, c.city
      ORDER BY totalRevenue ${sort === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT :limit
    `, {
      replacements: { limit: parseInt(limit) },
      type: sequelize.constructor.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/revenue-by-time - Doanh thu theo thời gian
exports.revenueByTime = async (req, res) => {
  try {
    const { groupBy = 'month', year } = req.query;

    let dateFormat, groupClause;
    switch (groupBy) {
      case 'year':
        dateFormat = '%Y';
        groupClause = 'YEAR(o.orderDate)';
        break;
      case 'quarter':
        dateFormat = '%Y-Q';
        groupClause = "CONCAT(YEAR(o.orderDate), '-Q', QUARTER(o.orderDate))";
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        groupClause = "DATE_FORMAT(o.orderDate, '%Y-%m')";
        break;
    }

    let whereClause = '';
    const replacements = {};
    if (year) {
      whereClause = 'WHERE YEAR(o.orderDate) = :year';
      replacements.year = parseInt(year);
    }

    const results = await sequelize.query(`
      SELECT 
        ${groupClause} as period,
        COUNT(DISTINCT o.orderNumber) as totalOrders,
        SUM(od.quantityOrdered * od.priceEach) as totalRevenue,
        SUM(od.quantityOrdered) as totalQuantity
      FROM orders o
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `, {
      replacements,
      type: sequelize.constructor.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/revenue-by-product - Doanh thu theo mặt hàng
exports.revenueByProduct = async (req, res) => {
  try {
    const { limit = 20, groupBy = 'product' } = req.query;

    let query;
    if (groupBy === 'productLine') {
      query = `
        SELECT 
          p.productLine,
          COUNT(DISTINCT p.productCode) as totalProducts,
          COUNT(DISTINCT od.orderNumber) as totalOrders,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue,
          SUM(od.quantityOrdered) as totalQuantity
        FROM products p
        JOIN orderdetails od ON p.productCode = od.productCode
        GROUP BY p.productLine
        ORDER BY totalRevenue DESC
      `;
    } else {
      query = `
        SELECT 
          p.productCode,
          p.productName,
          p.productLine,
          p.buyPrice,
          p.MSRP,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue,
          SUM(od.quantityOrdered) as totalQuantity,
          COUNT(DISTINCT od.orderNumber) as totalOrders
        FROM products p
        JOIN orderdetails od ON p.productCode = od.productCode
        GROUP BY p.productCode, p.productName, p.productLine, p.buyPrice, p.MSRP
        ORDER BY totalRevenue DESC
        LIMIT :limit
      `;
    }

    const results = await sequelize.query(query, {
      replacements: { limit: parseInt(limit) },
      type: sequelize.constructor.QueryTypes.SELECT
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/order-status - Thống kê trạng thái đơn hàng
exports.orderStatus = async (req, res) => {
  try {
    const results = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('orderNumber')), 'count']
      ],
      group: ['status'],
      order: [[fn('COUNT', col('orderNumber')), 'DESC']]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/revenue-by-country - Doanh thu theo quốc gia
exports.revenueByCountry = async (req, res) => {
  try {
    const results = await sequelize.query(`
      SELECT 
        c.country,
        COUNT(DISTINCT c.customerNumber) as totalCustomers,
        COUNT(DISTINCT o.orderNumber) as totalOrders,
        SUM(od.quantityOrdered * od.priceEach) as totalRevenue
      FROM customers c
      JOIN orders o ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      GROUP BY c.country
      ORDER BY totalRevenue DESC
    `, { type: sequelize.constructor.QueryTypes.SELECT });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/pivot-data - Dữ liệu cho Pivot Table
exports.pivotData = async (req, res) => {
  try {
    const results = await sequelize.query(`
      SELECT 
        c.customerName,
        c.country,
        c.city,
        o.orderNumber,
        o.orderDate,
        o.status as orderStatus,
        YEAR(o.orderDate) as orderYear,
        MONTH(o.orderDate) as orderMonth,
        QUARTER(o.orderDate) as orderQuarter,
        p.productName,
        p.productLine,
        p.productVendor,
        p.productScale,
        od.quantityOrdered,
        CAST(od.priceEach AS DECIMAL(10,2)) + 0 as priceEach,
        CAST(od.quantityOrdered * od.priceEach AS DECIMAL(12,2)) + 0 as lineTotal,
        CAST(p.buyPrice AS DECIMAL(10,2)) + 0 as buyPrice,
        CAST((od.priceEach - p.buyPrice) * od.quantityOrdered AS DECIMAL(12,2)) + 0 as profit
      FROM customers c
      JOIN orders o ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      JOIN products p ON od.productCode = p.productCode
      ORDER BY o.orderDate DESC
    `, { type: sequelize.constructor.QueryTypes.SELECT });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stats/years - Danh sách năm có đơn hàng
exports.getYears = async (req, res) => {
  try {
    const results = await sequelize.query(`
      SELECT DISTINCT YEAR(orderDate) as year
      FROM orders
      ORDER BY year ASC
    `, { type: sequelize.constructor.QueryTypes.SELECT });
    res.json(results.map(r => r.year));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
