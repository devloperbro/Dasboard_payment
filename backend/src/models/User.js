const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    class User extends Model {
        static async hashPassword(password) {
            return await bcrypt.hash(password, 10);
        }

        async validatePassword(password) {
            return await bcrypt.compare(password, this.password);
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        mobile: {
            type: DataTypes.STRING(15)
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true
        },
        company_name: {
            type: DataTypes.STRING(100)
        },
        aadhaar_card: {
            type: DataTypes.STRING(12)
        },
        pancard: {
            type: DataTypes.STRING(10)
        },
        address: {
            type: DataTypes.TEXT
        },
        city: {
            type: DataTypes.STRING(50)
        },
        state: {
            type: DataTypes.STRING(50)
        },
        pincode: {
            type: DataTypes.STRING(10)
        },
        gst_no: {
            type: DataTypes.STRING(15)
        },
        business_type: {
            type: DataTypes.ENUM('pvtltd', 'partnership', 'proprietorship', 'llp', 'public')
        },
        user_type: {
            type: DataTypes.ENUM('admin', 'payin_payout', 'staff', 'agent', 'payout_only'),
            allowNull: false
        },
        agent_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        pin: {
            type: DataTypes.STRING(6)
        },
        remember_token: {
            type: DataTypes.STRING(100)
        },
        created_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        updated_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        // --- Production-readiness additions (additive) ---
        // SQL: ALTER TABLE users ADD COLUMN is_main_admin TINYINT(1) DEFAULT 0 NOT NULL;
        is_main_admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        // SQL: ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0 NOT NULL;
        must_change_password: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        // SQL: ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL;
        password_changed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await User.hashPassword(user.password);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await User.hashPassword(user.password);
                    user.password_changed_at = new Date();
                }
            }
        }
    });

    return User;
}; 