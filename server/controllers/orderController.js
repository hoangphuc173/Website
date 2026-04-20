const { Op } = require('sequelize');
const { Order, OrderDetail, Product, Customer } = require('../models');

// GET /api/orders - Danh sách đơn hàng
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, customerNumber } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customerNumber) where.customerNumber = customerNumber;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate[Op.gte] = startDate;
      if (endDate) where.orderDate[Op.lte] = endDate;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['customerNumber', 'customerName', 'country'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['orderDate', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/orders/statuses - Danh sách trạng thái
exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Order.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('status')), 'status']],
      order: [['status', 'ASC']]
    });
    res.json(statuses.map(s => s.status));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/orders/:id - Chi tiết đơn hàng
exports.getById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: OrderDetail, as: 'orderDetails',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
