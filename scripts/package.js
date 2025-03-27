/**
 * Packaging script for Tweet Copier extension
 * Creates a zip file for submission to the Chrome Web Store
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Creates a zip file of the extension
 */
const packageExtension = () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const outputFilename = `tweet-copier-v${packageJson.version}.zip`;
  const output = fs.createWriteStream(outputFilename);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Listen for warnings and errors
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  // Start piping data
  archive.pipe(output);

  // Add files
  const filesToInclude = [
    'manifest.json',
    'content.js',
    'popup.html',
    'popup.js',
    'styles.css',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ];

  filesToInclude.forEach(file => {
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isFile()) {
        archive.file(file, { name: file });
      }
    } else {
      console.warn(`Warning: ${file} does not exist and will not be included in the package.`);
    }
  });

  // Finalize the archive
  archive.finalize();

  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`Extension packaged successfully: ${outputFilename} (${sizeInMB} MB)`);
  });
};

// Run the packaging function
packageExtension(); 