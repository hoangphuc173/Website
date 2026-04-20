const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('customers', {
  customerNumber: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  contactLastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  contactFirstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  addressLine1: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  addressLine2: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  salesRepEmployeeNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  creditLimit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
});

module.exports = Customer;
