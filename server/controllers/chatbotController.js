const sequelize = require('../config/database');
const { Customer, Order, OrderDetail, Product, Payment } = require('../models');
const { Op, fn, col } = require('sequelize');

// Chatbot hỏi đáp về CSDL ClassicModels
// Phân tích câu hỏi và trả lời dựa trên dữ liệu thực

const patterns = [
  // --- Customers ---
  {
    regex: /(?:bao nhi[eê]u|t[oổ]ng s[oố]|đ[eế]m|count).*(?:kh[aá]ch h[aà]ng|customer)/i,
    handler: async () => {
      const count = await Customer.count();
      return { text: `📊 Hệ thống hiện có **${count}** khách hàng.`, data: { totalCustomers: count } };
    }
  },
  {
    regex: /(?:bao nhi[eê]u|t[oổ]ng s[oố]|đ[eế]m|count).*(?:đ[oơ]n h[aà]ng|order)/i,
    handler: async () => {
      const count = await Order.count();
      return { text: `📦 Hệ thống hiện có **${count}** đơn hàng.`, data: { totalOrders: count } };
    }
  },
  {
    regex: /(?:bao nhi[eê]u|t[oổ]ng s[oố]|đ[eế]m|count).*(?:s[aả]n ph[aẩ]m|product|m[aặ]t h[aà]ng)/i,
    handler: async () => {
      const count = await Product.count();
      return { text: `🏷️ Hệ thống hiện có **${count}** sản phẩm.`, data: { totalProducts: count } };
    }
  },
  {
    regex: /(?:t[oổ]ng)?\s*(?:doanh thu|revenue|doanh s[oố])/i,
    handler: async () => {
      const result = await sequelize.query(`
        SELECT SUM(od.quantityOrdered * od.priceEach) as total
        FROM orderdetails od
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const total = parseFloat(result[0].total).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      return { text: `💰 Tổng doanh thu: **${total}**`, data: result[0] };
    }
  },
  {
    regex: /(?:top|h[aà]ng đ[aầ]u|l[oớ]n nh[aấ]t|nhi[eề]u nh[aấ]t).*(?:kh[aá]ch h[aà]ng|customer)/i,
    handler: async () => {
      const results = await sequelize.query(`
        SELECT c.customerName, c.country,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue
        FROM customers c
        JOIN orders o ON c.customerNumber = o.customerNumber
        JOIN orderdetails od ON o.orderNumber = od.orderNumber
        GROUP BY c.customerNumber, c.customerName, c.country
        ORDER BY totalRevenue DESC
        LIMIT 5
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const list = results.map((r, i) => `${i + 1}. **${r.customerName}** (${r.country}) - $${parseFloat(r.totalRevenue).toLocaleString()}`).join('\n');
      return { text: `🏆 **Top 5 khách hàng có doanh thu cao nhất:**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:top|b[aá]n ch[aạ]y|nhi[eề]u nh[aấ]t).*(?:s[aả]n ph[aẩ]m|product|m[aặ]t h[aà]ng)/i,
    handler: async () => {
      const results = await sequelize.query(`
        SELECT p.productName, p.productLine,
          SUM(od.quantityOrdered) as totalSold,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue
        FROM products p
        JOIN orderdetails od ON p.productCode = od.productCode
        GROUP BY p.productCode, p.productName, p.productLine
        ORDER BY totalSold DESC
        LIMIT 5
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const list = results.map((r, i) => `${i + 1}. **${r.productName}** (${r.productLine}) - Đã bán: ${r.totalSold}`).join('\n');
      return { text: `🔥 **Top 5 sản phẩm bán chạy nhất:**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:qu[oố]c gia|n[uư][oớ]c|country).*(?:nhi[eề]u|l[oớ]n|top)/i,
    handler: async () => {
      const results = await sequelize.query(`
        SELECT c.country,
          COUNT(DISTINCT c.customerNumber) as totalCustomers,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue
        FROM customers c
        JOIN orders o ON c.customerNumber = o.customerNumber
        JOIN orderdetails od ON o.orderNumber = od.orderNumber
        GROUP BY c.country
        ORDER BY totalRevenue DESC
        LIMIT 5
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const list = results.map((r, i) => `${i + 1}. **${r.country}** - ${r.totalCustomers} KH - $${parseFloat(r.totalRevenue).toLocaleString()}`).join('\n');
      return { text: `🌍 **Top 5 quốc gia có doanh thu cao nhất:**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:tr[aạ]ng th[aá]i|status).*(?:đ[oơ]n|order)/i,
    handler: async () => {
      const results = await sequelize.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const list = results.map(r => `- **${r.status}**: ${r.count} đơn`).join('\n');
      return { text: `📋 **Thống kê trạng thái đơn hàng:**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:t[iì]m|search|tra c[uứ]u).*(?:kh[aá]ch|customer)\s+(.+)/i,
    handler: async (match) => {
      const keyword = match[1].trim();
      const results = await Customer.findAll({
        where: {
          [Op.or]: [
            { customerName: { [Op.like]: `%${keyword}%` } },
            { contactFirstName: { [Op.like]: `%${keyword}%` } },
            { contactLastName: { [Op.like]: `%${keyword}%` } },
            { country: { [Op.like]: `%${keyword}%` } },
            { city: { [Op.like]: `%${keyword}%` } }
          ]
        },
        limit: 5,
        attributes: ['customerNumber', 'customerName', 'country', 'city', 'phone']
      });
      if (results.length === 0) return { text: `❌ Không tìm thấy khách hàng với từ khóa "**${keyword}**"` };
      const list = results.map(r => `- **${r.customerName}** (${r.country}, ${r.city}) - ☎ ${r.phone}`).join('\n');
      return { text: `🔍 **Kết quả tìm kiếm khách hàng "${keyword}":**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:t[iì]m|search|tra c[uứ]u).*(?:s[aả]n ph[aẩ]m|product)\s+(.+)/i,
    handler: async (match) => {
      const keyword = match[1].trim();
      const results = await Product.findAll({
        where: {
          [Op.or]: [
            { productName: { [Op.like]: `%${keyword}%` } },
            { productLine: { [Op.like]: `%${keyword}%` } }
          ]
        },
        limit: 5,
        attributes: ['productCode', 'productName', 'productLine', 'buyPrice', 'MSRP']
      });
      if (results.length === 0) return { text: `❌ Không tìm thấy sản phẩm với từ khóa "**${keyword}**"` };
      const list = results.map(r => `- **${r.productName}** (${r.productLine}) - Giá: $${r.buyPrice} / MSRP: $${r.MSRP}`).join('\n');
      return { text: `🔍 **Kết quả tìm kiếm sản phẩm "${keyword}":**\n${list}`, data: results };
    }
  },
  {
    regex: /(?:thanh to[aá]n|payment|đ[aã] tr[aả])/i,
    handler: async () => {
      const result = await sequelize.query(`
        SELECT 
          COUNT(*) as totalPayments,
          SUM(amount) as totalAmount,
          MIN(paymentDate) as firstPayment,
          MAX(paymentDate) as lastPayment
        FROM payments
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const r = result[0];
      return {
        text: `💳 **Thống kê thanh toán:**\n- Tổng số lần thanh toán: **${r.totalPayments}**\n- Tổng số tiền: **$${parseFloat(r.totalAmount).toLocaleString()}**\n- Thanh toán đầu tiên: **${r.firstPayment}**\n- Thanh toán gần nhất: **${r.lastPayment}**`,
        data: r
      };
    }
  },
  {
    regex: /(?:product\s*line|dòng sản phẩm|nhóm sản phẩm|loại sản phẩm)/i,
    handler: async () => {
      const results = await sequelize.query(`
        SELECT pl.productLine, COUNT(p.productCode) as totalProducts,
          SUM(od.quantityOrdered) as totalSold,
          SUM(od.quantityOrdered * od.priceEach) as totalRevenue
        FROM productlines pl
        LEFT JOIN products p ON pl.productLine = p.productLine
        LEFT JOIN orderdetails od ON p.productCode = od.productCode
        GROUP BY pl.productLine
        ORDER BY totalRevenue DESC
      `, { type: sequelize.constructor.QueryTypes.SELECT });
      const list = results.map(r => `- **${r.productLine}**: ${r.totalProducts} SP, Đã bán: ${r.totalSold || 0}, DT: $${parseFloat(r.totalRevenue || 0).toLocaleString()}`).join('\n');
      return { text: `📦 **Thống kê theo dòng sản phẩm:**\n${list}`, data: results };
    }
  }
];

// Suggestions for the user
const suggestions = [
  'Tổng số khách hàng?',
  'Tổng doanh thu?',
  'Top khách hàng lớn nhất?',
  'Top sản phẩm bán chạy nhất?',
  'Trạng thái đơn hàng?',
  'Quốc gia nhiều doanh thu nhất?',
  'Thống kê thanh toán?',
  'Tìm khách hàng USA',
  'Tìm sản phẩm Classic Cars',
  'Dòng sản phẩm?',
  'Tổng số đơn hàng?',
  'Tổng số sản phẩm?'
];

// POST /api/chatbot - Xử lý câu hỏi chatbot
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.json({
        reply: '👋 Xin chào! Tôi là trợ lý ảo ClassicModels. Hãy hỏi tôi về khách hàng, đơn hàng, sản phẩm, doanh thu...',
        suggestions
      });
    }

    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        const result = await pattern.handler(match);
        return res.json({ reply: result.text, data: result.data, suggestions: suggestions.slice(0, 4) });
      }
    }

    // Default response
    return res.json({
      reply: `🤔 Tôi chưa hiểu câu hỏi "**${message}**". Bạn có thể thử hỏi:\n${suggestions.map(s => `- ${s}`).join('\n')}`,
      suggestions
    });
  } catch (error) {
    res.status(500).json({ reply: `❌ Lỗi: ${error.message}`, error: error.message });
  }
};

// GET /api/chatbot/suggestions - Lấy gợi ý
exports.getSuggestions = async (req, res) => {
  res.json(suggestions);
};
