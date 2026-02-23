require('dotenv').config();
const mongoose = require('mongoose');

async function testMongo() {
    console.log('Testing Connection to:', process.env.MONGODB_URI.substring(0, 30) + '...');
    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('SUCCESS: Connected to MongoDB! ✅');
        process.exit(0);
    } catch (err) {
        console.error('FAILED: Connection error ❌');
        console.error(err);
        process.exit(1);
    }
}

testMongo();
