const { execSync } = require('child_process');

console.log('Installing Tailwind CSS dependencies...');

try {
  execSync('npm install tailwindcss@^3.4.17 postcss@^8.4.47 autoprefixer@^10.4.20 --save-dev', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!');
  console.log('Now restart your development server with: npm run dev');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
}
