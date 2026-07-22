const { sequelize } = require('../config/database');
const UserModel = require('../models/User');
const User = UserModel(sequelize);

const createTestUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Check if test user already exists
        const existingUser = await User.findOne({
            where: { user_name: 'testuser' }
        });

        if (existingUser) {
            console.log('Test user already exists');
            console.log('\n✅ TEST USER CREDENTIALS:');
            console.log('Username: testuser');
            console.log('Password: password123');
            console.log('Email: testuser@example.com');
            console.log('User Type: payin_payout');
            process.exit(0);
        }

        // Create test user
        const testUser = await User.create({
            name: 'Test User',
            user_name: 'testuser',
            password: 'password123', // This will be hashed by the model hook
            email: 'testuser@example.com',
            mobile: '9876543210',
            company_name: 'Test Company',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            user_type: 'payin_payout',
            created_by: null
        });

        console.log('\n✅ Test user created successfully!');
        console.log('\n📋 TEST USER CREDENTIALS:');
        console.log('─'.repeat(50));
        console.log('Username: testuser');
        console.log('Password: password123');
        console.log('Email: testuser@example.com');
        console.log('User Type: payin_payout (Regular User)');
        console.log('User ID:', testUser.id);
        console.log('─'.repeat(50));
        console.log('\n🌐 Access the frontend at: http://localhost:5173/login');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
};

createTestUser();
