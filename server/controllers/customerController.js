const { Op } = require('sequelize');
const { Customer, Order, OrderDetail, Product, Payment, Employee } = require('../models');

// GET /api/customers - Lấy danh sách khách hàng
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, country, city } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { customerName: { [Op.like]: `%${search}%` } },
        { contactFirstName: { [Op.like]: `%${search}%` } },
        { contactLastName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    if (country) where.country = country;
    if (city) where.city = { [Op.like]: `%${city}%` };

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'salesRep', attributes: ['firstName', 'lastName', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['customerNumber', 'ASC']]
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

// GET /api/customers/countries - Danh sách quốc gia
exports.getCountries = async (req, res) => {
  try {
    const countries = await Customer.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('country')), 'country']],
      order: [['country', 'ASC']]
    });
    res.json(countries.map(c => c.country));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/customers/:id - Chi tiết khách hàng
exports.getById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'salesRep', attributes: ['firstName', 'lastName', 'email'] },
        {
          model: Order, as: 'orders',
          include: [{ model: OrderDetail, as: 'orderDetails', include: [{ model: Product, as: 'product' }] }]
        },
        { model: Payment, as: 'payments' }
      ]
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/customers/:id/orders - Đơn hàng của khách hàng
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { customerNumber: req.params.id },
      include: [{
        model: OrderDetail, as: 'orderDetails',
        include: [{ model: Product, as: 'product', attributes: ['productCode', 'productName', 'productLine'] }]
      }],
      order: [['orderDate', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
