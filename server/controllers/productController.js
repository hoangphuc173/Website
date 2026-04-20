const { Op } = require('sequelize');
const { Product, ProductLine, OrderDetail } = require('../models');

// GET /api/products - Danh sách sản phẩm
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, productLine, vendor } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { productName: { [Op.like]: `%${search}%` } },
        { productCode: { [Op.like]: `%${search}%` } },
        { productVendor: { [Op.like]: `%${search}%` } }
      ];
    }
    if (productLine) where.productLine = productLine;
    if (vendor) where.productVendor = { [Op.like]: `%${vendor}%` };

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductLine, as: 'productLineInfo', attributes: ['productLine', 'textDescription'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['productName', 'ASC']]
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

// GET /api/products/lines - Danh sách product lines
exports.getProductLines = async (req, res) => {
  try {
    const lines = await ProductLine.findAll({
      attributes: ['productLine', 'textDescription'],
      order: [['productLine', 'ASC']]
    });
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products/:id - Chi tiết sản phẩm
exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductLine, as: 'productLineInfo' },
        {
          model: OrderDetail, as: 'orderDetails',
          attributes: ['orderNumber', 'quantityOrdered', 'priceEach']
        }
      ]
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
