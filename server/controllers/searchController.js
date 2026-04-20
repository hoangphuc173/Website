const { Op } = require('sequelize');
const { Customer, Order, Product, Employee } = require('../models');

// GET /api/search?q=keyword - Tìm kiếm tổng hợp
exports.search = async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ customers: [], orders: [], products: [] });
    }

    const keyword = `%${q.trim()}%`;
    const results = {};

    // Search customers
    if (!type || type === 'customers') {
      results.customers = await Customer.findAll({
        where: {
          [Op.or]: [
            { customerName: { [Op.like]: keyword } },
            { contactFirstName: { [Op.like]: keyword } },
            { contactLastName: { [Op.like]: keyword } },
            { phone: { [Op.like]: keyword } },
            { city: { [Op.like]: keyword } },
            { country: { [Op.like]: keyword } }
          ]
        },
        limit: 10,
        attributes: ['customerNumber', 'customerName', 'contactFirstName', 'contactLastName', 'phone', 'city', 'country']
      });
    }

    // Search orders
    if (!type || type === 'orders') {
      const orderWhere = {
        [Op.or]: [
          { status: { [Op.like]: keyword } },
          { comments: { [Op.like]: keyword } }
        ]
      };
      // If keyword is numeric, also search by orderNumber
      if (!isNaN(q.trim())) {
        orderWhere[Op.or].push({ orderNumber: parseInt(q.trim()) });
      }
      results.orders = await Order.findAll({
        where: orderWhere,
        include: [{ model: Customer, as: 'customer', attributes: ['customerName'] }],
        limit: 10,
        attributes: ['orderNumber', 'orderDate', 'status', 'customerNumber']
      });
    }

    // Search products
    if (!type || type === 'products') {
      results.products = await Product.findAll({
        where: {
          [Op.or]: [
            { productName: { [Op.like]: keyword } },
            { productCode: { [Op.like]: keyword } },
            { productLine: { [Op.like]: keyword } },
            { productVendor: { [Op.like]: keyword } },
            { productDescription: { [Op.like]: keyword } }
          ]
        },
        limit: 10,
        attributes: ['productCode', 'productName', 'productLine', 'productVendor', 'buyPrice', 'MSRP', 'quantityInStock']
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
