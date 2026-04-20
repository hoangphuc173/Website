const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductLine = sequelize.define('productlines', {
  productLine: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  textDescription: {
    type: DataTypes.STRING(4000),
    allowNull: true
  },
  htmlDescription: {
    type: DataTypes.TEXT('medium'),
    allowNull: true
  },
  image: {
    type: DataTypes.BLOB('medium'),
    allowNull: true
  }
});

module.exports = ProductLine;
