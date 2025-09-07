const { execSync } = require('child_process');

console.log('🔧 Fixing Tailwind CSS dependencies...\n');

try {
  // Remove existing Tailwind packages
  console.log('1. Removing existing Tailwind packages...');
  execSync('npm uninstall tailwindcss @tailwindcss/postcss', { stdio: 'inherit' });
  
  // Install stable Tailwind v3 and required dependencies
  console.log('\n2. Installing stable Tailwind CSS v3...');
  execSync('npm install tailwindcss@^3.4.17 postcss@^8.4.47 autoprefixer@^10.4.20 --save-dev', { stdio: 'inherit' });
  
  // Initialize Tailwind config
  console.log('\n3. Initializing Tailwind config...');
  execSync('npx tailwindcss init -p', { stdio: 'inherit' });
  
  console.log('\n✅ Tailwind CSS fixed successfully!');
  console.log('📝 Now restart your development server with: npm run dev');
  console.log('🎨 Your styles should work perfectly now!');
  
} catch (error) {
  console.error('\n❌ Error fixing Tailwind CSS:', error.message);
  console.log('\n💡 Try running these commands manually:');
  console.log('npm uninstall tailwindcss @tailwindcss/postcss');
  console.log('npm install tailwindcss@^3.4.17 postcss@^8.4.47 autoprefixer@^10.4.20 --save-dev');
  console.log('npx tailwindcss init -p');
}
