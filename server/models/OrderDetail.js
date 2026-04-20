const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('orderdetails', {
  orderNumber: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  productCode: {
    type: DataTypes.STRING(15),
    primaryKey: true
  },
  quantityOrdered: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  priceEach: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  orderLineNumber: {
    type: DataTypes.SMALLINT,
    allowNull: false
  }
});

module.exports = OrderDetail;
