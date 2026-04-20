const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('employees', {
  employeeNumber: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  extension: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  officeCode: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  reportsTo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  jobTitle: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
});

module.exports = Employee;
