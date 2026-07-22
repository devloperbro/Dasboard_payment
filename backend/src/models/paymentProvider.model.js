/**
 * PaymentProvider — Sequelize (MySQL) model
 *
 * Stores provider metadata and admin configuration.
 * NEVER stores gateway API secrets — those come from environment variables.
 *
 * SQL (production ALTER / CREATE):
 *   CREATE TABLE payment_providers (
 *     id INT PRIMARY KEY AUTO_INCREMENT,
 *     name VARCHAR(50) NOT NULL UNIQUE,
 *     display_name VARCHAR(100) NOT NULL,
 *     enabled TINYINT(1) DEFAULT 0 NOT NULL,
 *     mode ENUM('test','live') DEFAULT 'test' NOT NULL,
 *     payin_enabled TINYINT(1) DEFAULT 0 NOT NULL,
 *     payout_enabled TINYINT(1) DEFAULT 0 NOT NULL,
 *     is_active TINYINT(1) DEFAULT 0 NOT NULL,
 *     created_by INT NULL,
 *     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *     FOREIGN KEY (created_by) REFERENCES users(id)
 *   );
 *
 *   INSERT INTO payment_providers (name, display_name) VALUES
 *     ('razorpay', 'Razorpay'),
 *     ('phonepe', 'PhonePe');
 */
const { DataTypes } = require('sequelize');

const SUPPORTED_PROVIDERS = ['razorpay', 'phonepe'];

module.exports = (sequelize) => {
    const PaymentProvider = sequelize.define('PaymentProvider', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.ENUM(...SUPPORTED_PROVIDERS),
            allowNull: false,
            unique: true
        },
        display_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        mode: {
            type: DataTypes.ENUM('test', 'live'),
            defaultValue: 'test',
            allowNull: false
        },
        payin_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        payout_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'payment_providers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return PaymentProvider;
};

module.exports.SUPPORTED_PROVIDERS = SUPPORTED_PROVIDERS;
