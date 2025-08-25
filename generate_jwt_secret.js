const crypto = require('crypto');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 Generated JWT Secret:');
console.log('='.repeat(80));
console.log(jwtSecret);
console.log('='.repeat(80));
console.log('\n📝 Copy this and add it to your .env.local file:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  Keep this secret secure and never commit it to version control!');
