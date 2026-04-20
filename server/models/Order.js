const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('orders', {
  orderNumber: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  requiredDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  shippedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customerNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Order;
