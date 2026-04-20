const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Office = sequelize.define('offices', {
  officeCode: {
    type: DataTypes.STRING(10),
    primaryKey: true
  },
  city: {
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
  state: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  territory: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
});

module.exports = Office;
