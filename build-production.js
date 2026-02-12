const fs = require("fs-extra");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { minify: htmlMinify } = require("html-minifier-terser");
const CleanCSS = require("clean-css");
const { execSync } = require("child_process");

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, "dist");

// Configuration for JavaScript obfuscation
const jsObfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  numbersToExpressions: true,
  simplify: true,
  stringArrayShuffle: true,
  splitStrings: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  rotateStringArray: true,
  shuffleStringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 5,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType: "function",
  stringArrayThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  domainLock: [],
  domainLockRedirectUrl: "about:blank",
  forceTransformStrings: [],
  reservedNames: [],
  reservedStrings: [],
  seed: 0,
  sourceMap: false,
  sourceMapBaseUrl: "",
  sourceMapFileName: "",
  sourceMapMode: "separate",
  splitStringsChunkLength: 5,
  target: "browser",
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
  minifyURLs: false,
};

// CSS minification options
const cssMinifyOptions = {
  level: 2,
  compatibility: "ie8",
};

// Files and directories to exclude from processing
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build-production.js",
  "build-env.js",
  "package.json",
  "package-lock.json",
  ".env",
  ".env.example",
  "README.md",
  "SECURITY.md",
  ".gitignore",
  "scss",
];

// HTML files where inline JavaScript should NOT be obfuscated (only minified)
// Add filenames here to preserve readability of inline scripts while still minifying HTML
const HTML_INLINE_JS_IGNORE_LIST = ["payment.html"];

// Check if a file should be excluded
function shouldExclude(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  return EXCLUDE_PATTERNS.some(
    (pattern) =>
      relativePath.includes(pattern) || relativePath.startsWith(pattern),
  );
}

// Clean and create dist directory
async function setupDistDirectory() {
  console.log("Cleaning and setting up dist directory...");
  await fs.remove(DIST_DIR);
  await fs.ensureDir(DIST_DIR);
}

// Compile SCSS to CSS
async function compileSCSS() {
  console.log("Compiling SCSS...");
  execSync("sass scss/main.scss:css/main.css --style compressed", {
    cwd: SRC_DIR,
    stdio: "inherit",
  });
}

// Obfuscate JavaScript file
async function obfuscateJavaScript(inputPath, outputPath) {
  try {
    const code = await fs.readFile(inputPath, "utf8");

    const obfuscated = JavaScriptObfuscator.obfuscate(
      code,
      jsObfuscatorOptions,
    );
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
    let html = await fs.readFile(inputPath, "utf8");
    const fileName = path.basename(inputPath);
    const relativePath = path.relative(SRC_DIR, inputPath).replace(/\\/g, "/");
    const shouldObfuscateInlineJS =
      !HTML_INLINE_JS_IGNORE_LIST.includes(fileName) &&
      !HTML_INLINE_JS_IGNORE_LIST.includes(relativePath);

    // Extract and process inline JavaScript
    html = html.replace(
      /<script(?:\s[^>]*)?>([^]*?)<\/script>/gi,
      (match, scriptContent) => {
        if (scriptContent.trim()) {
          if (shouldObfuscateInlineJS) {
            try {
              const obfuscated = JavaScriptObfuscator.obfuscate(
                scriptContent,
                jsObfuscatorOptions,
              );
              return match.replace(
                scriptContent,
                obfuscated.getObfuscatedCode(),
              );
            } catch (error) {
              console.warn(
                `Warning: Could not obfuscate inline script in ${inputPath}`,
              );
              return match;
            }
          } else {
            console.log(
              `   Skipping inline JS obfuscation for ${fileName} (in ignore list)`,
            );
            return match; // Keep original inline script, will be minified by HTML minifier
          }
        }
        return match;
      },
    );

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
    const css = await fs.readFile(inputPath, "utf8");
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
        case ".js":
          await obfuscateJavaScript(fullSrcPath, fullDistPath);
          break;
        case ".html":
          await processHTML(fullSrcPath, fullDistPath);
          break;
        case ".css":
          await processCSS(fullSrcPath, fullDistPath);
          break;
        default:
          await copyFile(fullSrcPath, fullDistPath);
          break;
      }
    }
  }
}

// Create build info file
async function createBuildInfo() {
  const buildInfo = {
    buildDate: new Date().toISOString(),
    version: require("./package.json").version,
    buildType: "production",
    obfuscated: true,
    note: "This is a production build with obfuscated code. Source code is available in the repository.",
  };

  await fs.outputFile(
    path.join(DIST_DIR, "build-info.json"),
    JSON.stringify(buildInfo, null, 2),
  );
  console.log(" Created build info file");
}

// Main build function
async function build() {
  console.log(" Starting production build...\n");

  try {
    await setupDistDirectory();
    await compileSCSS();

    console.log("\n Processing files...");
    await processFiles();

    await createBuildInfo();

    console.log("\n Production build completed successfully!");
    console.log(` Output directory: ${DIST_DIR}`);

    // Show build summary
    const stats = await getBuildStats();
    console.log("\n Build Summary:");
    console.log(`  Files processed: ${stats.total}`);
    console.log(`  JavaScript files obfuscated: ${stats.js}`);
    console.log(`  HTML files processed: ${stats.html}`);
    console.log(`  CSS files minified: ${stats.css}`);
    console.log(`  Other files copied: ${stats.other}`);
  } catch (error) {
    console.error(" Build failed:", error);
    process.exit(1);
  }
}

// Get build statistics
async function getBuildStats() {
  const stats = { total: 0, js: 0, html: 0, css: 0, other: 0 };

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
          case ".js":
            stats.js++;
            break;
          case ".html":
            stats.html++;
            break;
          case ".css":
            stats.css++;
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
