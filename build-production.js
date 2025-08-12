const fs = require('fs-extra');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify: htmlMinify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { execSync } = require('child_process');

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

// Configuration for JavaScript obfuscation
const jsObfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  numbersToExpressions: true,
  simplify: true,
  stringArrayShuffle: true,
  splitStrings: true,
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  rotateStringArray: true,
  shuffleStringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 5,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  domainLock: [],
  domainLockRedirectUrl: 'about:blank',
  forceTransformStrings: [],
  reservedNames: [],
  reservedStrings: [],
  seed: 0,
  sourceMap: false,
  sourceMapBaseUrl: '',
  sourceMapFileName: '',
  sourceMapMode: 'separate',
  splitStringsChunkLength: 5,
  target: 'browser'
};

// HTML minification options
const htmlMinifyOptions = {
  removeComments: true,
  removeCommentsFromCDATA: true,
  removeCDATASectionsFromCDATA: true,
  collapseWhitespace: true,
  conservativeCollapse: false,
  preserveLineBreaks: false,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  preventAttributesEscaping: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: true,
  removeIgnored: false,
  removeEmptyElements: false,
  lint: false,
  keepClosingSlash: false,
  caseSensitive: false,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: false
};

// CSS minification options
const cssMinifyOptions = {
  level: 2,
  compatibility: 'ie8'
};

// Files and directories to exclude from processing
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build-production.js',
  'build-env.js',
  'package.json',
  'package-lock.json',
  '.env',
  'README.md',
  'SECURITY.md',
  '.gitignore',
  'run_dev.bat',
  'open_code.bat',
  'remove_empty_files.py',
  'removeemojis.py',
  'postcss.config.js',
  'scss',
  'email-template.html',
  'build_production.bat',
];

// HTML files where inline JavaScript should NOT be obfuscated (only minified)
// Add filenames here to preserve readability of inline scripts while still minifying HTML
const HTML_INLINE_JS_IGNORE_LIST = [
  'payment.html'
];

// JSON files to encrypt/obfuscate (files in data/ directory that contain sensitive or valuable data)
const JSON_ENCRYPT_LIST = [
  'portfolio.json',
  'services.json',
  'profanity.json'
];

// Simple encryption key (you can change this to any string)
const ENCRYPTION_KEY = 'triet-data-key-2025';

// Check if a file should be excluded
function shouldExclude(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  return EXCLUDE_PATTERNS.some(pattern => 
    relativePath.includes(pattern) || 
    relativePath.startsWith(pattern)
  );
}

// Simple XOR encryption for JSON data
function encryptString(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Encrypt and encode JSON data
function encryptJsonData(jsonString, key) {
  // First compress by removing unnecessary whitespace
  const compressed = JSON.stringify(JSON.parse(jsonString));
  
  // Encrypt the compressed JSON
  const encrypted = encryptString(compressed, key);
  
  // Encode to base64 for safe transport
  const encoded = Buffer.from(encrypted, 'binary').toString('base64');
  
  return encoded;
}

// Create a decoder function that will be included in the build
function generateDecoderFunction() {
  return `
// JSON Data Decoder - Auto-generated
window.DataDecoder = {
  key: '${ENCRYPTION_KEY}',
  
  decrypt: function(encodedData) {
    try {
      // Decode from base64
      const encrypted = Buffer.from ? 
        Buffer.from(encodedData, 'base64').toString('binary') :
        atob(encodedData); // Fallback for older browsers
      
      // Decrypt using XOR
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
      }
      
      // Parse JSON
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }
};
`.trim();
}

// Clean and create dist directory
async function setupDistDirectory() {
  console.log(' Cleaning and setting up dist directory...');
  await fs.remove(DIST_DIR);
  await fs.ensureDir(DIST_DIR);
}

// Generate environment configuration
async function generateEnvConfig() {
  console.log('  Generating environment configuration...');
  execSync('node build-env.js', { cwd: SRC_DIR, stdio: 'inherit' });
}

// Compile SCSS to CSS
async function compileSCSS() {
  console.log(' Compiling SCSS...');
  execSync('sass scss/main.scss:css/main.css --style compressed', { cwd: SRC_DIR, stdio: 'inherit' });
}

// Obfuscate JavaScript file
async function obfuscateJavaScript(inputPath, outputPath) {
  try {
    const code = await fs.readFile(inputPath, 'utf8');
    
    // Skip obfuscation for env-config.js
    if (path.basename(inputPath) === 'env-config.js') {
      console.log(`    Skipping obfuscation for ${path.relative(SRC_DIR, inputPath)} (preserved)`);
      await fs.copy(inputPath, outputPath);
      return;
    }
    
    const obfuscated = JavaScriptObfuscator.obfuscate(code, jsObfuscatorOptions);
    await fs.outputFile(outputPath, obfuscated.getObfuscatedCode());
    console.log(`   Obfuscated: ${path.relative(SRC_DIR, inputPath)}`);
  } catch (error) {
    console.error(`Error obfuscating ${inputPath}:`, error.message);
    // Fallback: copy original file if obfuscation fails
    await fs.copy(inputPath, outputPath);
  }
}

// Minify and obfuscate HTML file with an ignore list for inline javascript
async function processHTML(inputPath, outputPath) {
  try {
    let html = await fs.readFile(inputPath, 'utf8');
    const fileName = path.basename(inputPath);
    const shouldObfuscateInlineJS = !HTML_INLINE_JS_IGNORE_LIST.includes(fileName);
    
    // Extract and process inline JavaScript
    html = html.replace(/<script(?:\s[^>]*)?>([^]*?)<\/script>/gi, (match, scriptContent) => {
      if (scriptContent.trim()) {
        if (shouldObfuscateInlineJS) {
          try {
            const obfuscated = JavaScriptObfuscator.obfuscate(scriptContent, jsObfuscatorOptions);
            return match.replace(scriptContent, obfuscated.getObfuscatedCode());
          } catch (error) {
            console.warn(`Warning: Could not obfuscate inline script in ${inputPath}`);
            return match;
          }
        } else {
          console.log(`    Skipping inline JS obfuscation for ${fileName} (in ignore list)`);
          return match; // Keep original inline script, will be minified by HTML minifier
        }
      }
      return match;
    });
    
    const minified = await htmlMinify(html, htmlMinifyOptions);
    await fs.outputFile(outputPath, minified);
    console.log(`   Processed HTML: ${path.relative(SRC_DIR, inputPath)}`);
  } catch (error) {
    console.error(`Error processing HTML ${inputPath}:`, error.message);
    await fs.copy(inputPath, outputPath);
  }
}

// Minify CSS file
async function processCSS(inputPath, outputPath) {
  try {
    const css = await fs.readFile(inputPath, 'utf8');
    const minified = new CleanCSS(cssMinifyOptions).minify(css);
    
    if (minified.errors.length > 0) {
      console.warn(`CSS warnings for ${inputPath}:`, minified.errors);
    }
    
    await fs.outputFile(outputPath, minified.styles);
    console.log(`   Minified CSS: ${path.relative(SRC_DIR, inputPath)}`);
  } catch (error) {
    console.error(`Error processing CSS ${inputPath}:`, error.message);
    await fs.copy(inputPath, outputPath);
  }
}

// Encrypt/obfuscate JSON files
async function processJSON(inputPath, outputPath) {
  try {
    const fileName = path.basename(inputPath);
    
    if (JSON_ENCRYPT_LIST.includes(fileName)) {
      const jsonContent = await fs.readFile(inputPath, 'utf8');
      const encryptedData = encryptJsonData(jsonContent, ENCRYPTION_KEY);
      
      // Create a JavaScript file that contains the encrypted data
      const jsOutput = `
// Encrypted JSON data - Auto-generated from ${fileName}
window.EncryptedData = window.EncryptedData || {};
window.EncryptedData['${fileName.replace('.json', '')}'] = '${encryptedData}';

// Convenience function to decrypt this specific data
window.get${fileName.replace('.json', '').replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toUpperCase())}Data = function() {
  if (window.DataDecoder) {
    return window.DataDecoder.decrypt(window.EncryptedData['${fileName.replace('.json', '')}']);
  }
  console.error('DataDecoder not available. Make sure data-decoder.js is loaded first.');
  return null;
};
`.trim();

      // Change output extension to .js
      const jsOutputPath = outputPath.replace('.json', '.encrypted.js');
      await fs.outputFile(jsOutputPath, jsOutput);
      console.log(`  🔐 Encrypted JSON: ${path.relative(SRC_DIR, inputPath)} → ${path.basename(jsOutputPath)}`);
    } else {
      // Just copy regular JSON files
      await fs.copy(inputPath, outputPath);
      console.log(`  📋 Copied JSON: ${path.relative(SRC_DIR, inputPath)}`);
    }
  } catch (error) {
    console.error(`Error processing JSON ${inputPath}:`, error.message);
    await fs.copy(inputPath, outputPath);
  }
}

// Copy other files without processing
async function copyFile(inputPath, outputPath) {
  await fs.copy(inputPath, outputPath);
  console.log(`   Copied: ${path.relative(SRC_DIR, inputPath)}`);
}

// Process all files recursively
async function processFiles(srcPath = SRC_DIR, distPath = DIST_DIR) {
  const items = await fs.readdir(srcPath);
  
  for (const item of items) {
    const fullSrcPath = path.join(srcPath, item);
    const fullDistPath = path.join(distPath, item);
    
    if (shouldExclude(fullSrcPath)) {
      continue;
    }
    
    const stats = await fs.stat(fullSrcPath);
    
    if (stats.isDirectory()) {
      await fs.ensureDir(fullDistPath);
      await processFiles(fullSrcPath, fullDistPath);
    } else {
      const ext = path.extname(item).toLowerCase();
      
      switch (ext) {
        case '.js':
          await obfuscateJavaScript(fullSrcPath, fullDistPath);
          break;
        case '.html':
          await processHTML(fullSrcPath, fullDistPath);
          break;
        case '.css':
          await processCSS(fullSrcPath, fullDistPath);
          break;
        case '.json':
          await processJSON(fullSrcPath, fullDistPath);
          break;
        default:
          await copyFile(fullSrcPath, fullDistPath);
          break;
      }
    }
  }
}

// Create data decoder file
async function createDataDecoder() {
  const decoderContent = generateDecoderFunction();
  await fs.outputFile(
    path.join(DIST_DIR, 'js', 'data-decoder.js'),
    decoderContent
  );
  console.log('🔑 Created data decoder file');
}

// Create build info file
async function createBuildInfo() {
  const buildInfo = {
    buildDate: new Date().toISOString(),
    version: require('./package.json').version,
    buildType: 'production',
    obfuscated: true,
    note: 'This is a production build with obfuscated code. Source code is available in the repository.'
  };
  
  await fs.outputFile(
    path.join(DIST_DIR, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );
  console.log(' Created build info file');
}

// Main build function
async function build() {
  console.log(' Starting production build...\n');
  
  try {
    await setupDistDirectory();
    await generateEnvConfig();
    await compileSCSS();
    
    console.log('\n Processing files...');
    await processFiles();
    
    await createDataDecoder();
    await createBuildInfo();
    
    console.log('\n Production build completed successfully!');
    console.log(` Output directory: ${DIST_DIR}`);
    
    // Show build summary
    const stats = await getBuildStats();
    console.log('\n Build Summary:');
    console.log(`  Files processed: ${stats.total}`);
    console.log(`  JavaScript files obfuscated: ${stats.js}`);
    console.log(`  HTML files processed: ${stats.html}`);
    console.log(`  CSS files minified: ${stats.css}`);
    console.log(`  JSON files processed: ${stats.json}`);
    console.log(`  Other files copied: ${stats.other}`);
    
  } catch (error) {
    console.error(' Build failed:', error);
    process.exit(1);
  }
}

// Get build statistics
async function getBuildStats() {
  const stats = { total: 0, js: 0, html: 0, css: 0, json: 0, other: 0 };
  
  async function countFiles(dir) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await countFiles(fullPath);
      } else {
        stats.total++;
        const ext = path.extname(item).toLowerCase();
        
        switch (ext) {
          case '.js':
            stats.js++;
            break;
          case '.html':
            stats.html++;
            break;
          case '.css':
            stats.css++;
            break;
          case '.json':
            stats.json++;
            break;
          default:
            stats.other++;
            break;
        }
      }
    }
  }
  
  await countFiles(DIST_DIR);
  return stats;
}

// Run the build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build };
