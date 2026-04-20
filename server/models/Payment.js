const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('payments', {
  customerNumber: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  checkNumber: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Payment;
