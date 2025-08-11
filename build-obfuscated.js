const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Load environment variables from .env file
require('dotenv').config();

const SOURCE_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Clean and create public directory
const setupPublicDirectory = () => {
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('✅ Public directory created');
};

// Generate env-config.js from environment variables
const generateEnvConfig = () => {
  const envVars = {
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || '',
    EMAILJS_TEMPLATE_ID_ADMIN: process.env.EMAILJS_TEMPLATE_ID_ADMIN || '',
    EMAILJS_TEMPLATE_ID_CUSTOMER: process.env.EMAILJS_TEMPLATE_ID_CUSTOMER || '',
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || '',
    PP_CLIENT_ID: process.env.PP_CLIENT_ID || '',
    PP_API_BASE: process.env.PP_API_BASE || 'https://api.paypal.com'
  };

  const configContent = `window.ENV_CONFIG = {
  EMAILJS_SERVICE_ID: '${envVars.EMAILJS_SERVICE_ID}',
  EMAILJS_TEMPLATE_ID_ADMIN: '${envVars.EMAILJS_TEMPLATE_ID_ADMIN}',
  EMAILJS_TEMPLATE_ID_CUSTOMER: '${envVars.EMAILJS_TEMPLATE_ID_CUSTOMER}',
  EMAILJS_PUBLIC_KEY: '${envVars.EMAILJS_PUBLIC_KEY}',
  PP_CLIENT_ID: '${envVars.PP_CLIENT_ID}',
  PP_API_BASE: '${envVars.PP_API_BASE}'
};
window.EMAILJS_SERVICE_ID = window.ENV_CONFIG.EMAILJS_SERVICE_ID;
window.EMAILJS_TEMPLATE_ID_ADMIN = window.ENV_CONFIG.EMAILJS_TEMPLATE_ID_ADMIN;
window.EMAILJS_TEMPLATE_ID_CUSTOMER = window.ENV_CONFIG.EMAILJS_TEMPLATE_ID_CUSTOMER;
window.EMAILJS_PUBLIC_KEY = window.ENV_CONFIG.EMAILJS_PUBLIC_KEY;
window.PP_CLIENT_ID = window.ENV_CONFIG.PP_CLIENT_ID;
window.PP_API_BASE = window.ENV_CONFIG.PP_API_BASE;`;

  return configContent;
};

// Obfuscate JavaScript code
const obfuscateCode = (code) => {
  const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Set to true for extra protection but may cause issues
    debugProtectionInterval: 0,
    disableConsoleOutput: false, // Set to true to disable console.log in production
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
  });

  return obfuscationResult.getObfuscatedCode();
};

// Copy and process files
const processFiles = () => {
  // Copy static files (HTML, CSS, images, etc.)
  const copyStaticFiles = (srcDir, destDir, relativePath = '') => {
    const items = fs.readdirSync(srcDir);
    
    items.forEach(item => {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      // Skip certain directories and files
      if (item === 'node_modules' || item === 'public' || item === '.git' || 
          item === '.env' || item === 'build-env.js' || item === 'build-obfuscated.js' ||
          item.startsWith('.') || item.endsWith('.bat') || item.endsWith('.py')) {
        return;
      }
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyStaticFiles(srcPath, destPath, itemRelativePath);
      } else if (stat.isFile()) {
        if (item.endsWith('.js')) {
          // Process JavaScript files
          let content = fs.readFileSync(srcPath, 'utf8');
          
          // If this is env-config.js, generate it fresh
          if (item === 'env-config.js') {
            content = generateEnvConfig();
          }
          
          // Obfuscate JavaScript
          try {
            const obfuscatedContent = obfuscateCode(content);
            fs.writeFileSync(destPath, obfuscatedContent);
            console.log(`🔒 Obfuscated: ${itemRelativePath}`);
          } catch (error) {
            console.warn(`⚠️  Failed to obfuscate ${itemRelativePath}, copying original:`, error.message);
            fs.copyFileSync(srcPath, destPath);
          }
        } else {
          // Copy other files as-is
          fs.copyFileSync(srcPath, destPath);
          console.log(`📄 Copied: ${itemRelativePath}`);
        }
      }
    });
  };

  copyStaticFiles(SOURCE_DIR, PUBLIC_DIR);
};

// Main build process
const build = () => {
  console.log('🚀 Starting obfuscated build process...\n');
  
  try {
    setupPublicDirectory();
    processFiles();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📁 Output directory: ${PUBLIC_DIR}`);
    console.log('\n🔒 All JavaScript files have been obfuscated');
    console.log('🔑 Environment variables have been embedded securely');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

build();
