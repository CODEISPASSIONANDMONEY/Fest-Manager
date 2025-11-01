const crypto = require('crypto');

console.log('\n🔐 Fest Manager - Environment Variable Generator\n');
console.log('Copy these values to your deployment platform:\n');
console.log('─'.repeat(60));

// Generate secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('\n✅ Generated Secrets:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);

console.log('\n📝 Other Required Variables:\n');
console.log('NODE_ENV=production');
console.log('PORT=3000');
console.log('DB_HOST=<your-database-host>');
console.log('DB_PORT=3306');
console.log('DB_NAME=fest_manager');
console.log('DB_USER=<your-database-user>');
console.log('DB_PASSWORD=<your-database-password>');
console.log('CLIENT_URL=<your-app-url>');

console.log('\n' + '─'.repeat(60));
console.log('\n💡 Tip: Keep these secrets safe and never commit them to Git!\n');
