const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('products', {
  productCode: {
    type: DataTypes.STRING(15),
    primaryKey: true
  },
  productName: {
    type: DataTypes.STRING(70),
    allowNull: false
  },
  productLine: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  productScale: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  productVendor: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  productDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  quantityInStock: {
    type: DataTypes.SMALLINT,
    allowNull: false
  },
  buyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  MSRP: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Product;
