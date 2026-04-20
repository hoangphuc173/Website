const Customer = require('./Customer');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Product = require('./Product');
const ProductLine = require('./ProductLine');
const Employee = require('./Employee');
const Office = require('./Office');
const Payment = require('./Payment');

// ==================== ASSOCIATIONS ====================

// Customer <-> Order
Customer.hasMany(Order, { foreignKey: 'customerNumber', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerNumber', as: 'customer' });

// Customer <-> Payment
Customer.hasMany(Payment, { foreignKey: 'customerNumber', as: 'payments' });
Payment.belongsTo(Customer, { foreignKey: 'customerNumber', as: 'customer' });

// Order <-> OrderDetail
Order.hasMany(OrderDetail, { foreignKey: 'orderNumber', as: 'orderDetails' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderNumber', as: 'order' });

// Product <-> OrderDetail
Product.hasMany(OrderDetail, { foreignKey: 'productCode', as: 'orderDetails' });
OrderDetail.belongsTo(Product, { foreignKey: 'productCode', as: 'product' });

// ProductLine <-> Product
ProductLine.hasMany(Product, { foreignKey: 'productLine', as: 'products' });
Product.belongsTo(ProductLine, { foreignKey: 'productLine', as: 'productLineInfo' });

// Employee <-> Customer (Sales Rep)
Employee.hasMany(Customer, { foreignKey: 'salesRepEmployeeNumber', as: 'customers' });
Customer.belongsTo(Employee, { foreignKey: 'salesRepEmployeeNumber', as: 'salesRep' });

// Office <-> Employee
Office.hasMany(Employee, { foreignKey: 'officeCode', as: 'employees' });
Employee.belongsTo(Office, { foreignKey: 'officeCode', as: 'office' });

// Employee self-referencing (reports to)
Employee.hasMany(Employee, { foreignKey: 'reportsTo', as: 'subordinates' });
Employee.belongsTo(Employee, { foreignKey: 'reportsTo', as: 'manager' });

module.exports = {
  Customer,
  Order,
  OrderDetail,
  Product,
  ProductLine,
  Employee,
  Office,
  Payment
};
