const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'completed'),
    defaultValue: 'active'
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id'
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by'
  }
}, {
  timestamps: true,
  tableName: 'projects',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Project;