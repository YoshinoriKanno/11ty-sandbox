const sass = require('sass');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function (eleventyConfig) {
  // Watch対象にSassやTypeScriptファイルを追加
  eleventyConfig.addWatchTarget('./src/styles/');
  eleventyConfig.addWatchTarget('./src/scripts/');

  let processedImages = new Set();

  eleventyConfig.on('beforeWatch', async (changedFiles) => {
    if (changedFiles.some(file => file.endsWith('.scss'))) {
      console.log("Sassファイルが変更されました。");
      // 必要な処理
    } else if (changedFiles.some(file => file.endsWith('.ts'))) {
      console.log("TypeScriptファイルが変更されました。");
      // 必要な処理
    } else if (changedFiles.some(file => file.endsWith('.njk') || file.endsWith('.md'))) {
      console.log("テンプレートまたはMarkdownファイルが変更されました。通常通りビルドを行います。");
    }
  });

  // 画像処理を変更時にのみ実行
  eleventyConfig.on('beforeBuild', async () => {
    const imagesDir = 'src/assets/images';
    const outputImagesDir = 'dist/images';

    const processImages = async (inputDir, outputDir) => {
      const entries = await fs.promises.readdir(inputDir, { withFileTypes: true });

      for (const entry of entries) {
        const inputPath = path.join(inputDir, entry.name);
        const outputPath = path.join(outputDir, entry.name);

        if (entry.isDirectory()) {
          if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
          }
          await processImages(inputPath, outputPath);
        } else {
          if (!processedImages.has(inputPath)) {
            try {
              const image = sharp(inputPath);
              const metadata = await image.metadata();

              if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                await image.jpeg({ quality: 60 }).toFile(outputPath);
              } else if (metadata.format === 'png') {
                await image.png({ quality: 65 }).toFile(outputPath);
              } else {
                await fs.promises.copyFile(inputPath, outputPath);
              }

              processedImages.add(inputPath);
            } catch (err) {
              console.error(`Error processing ${entry.name}:`, err);
            }
          }
        }
      }
    };

    await processImages(imagesDir, outputImagesDir);
  });

  // JavaScript ファイルを src/scripts から dist/scripts にコピーする設定を追加
  eleventyConfig.addPassthroughCopy({ 'src/scripts/**/*.js': 'scripts' });

  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("src/blog/_posts/*.md").reverse();
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
    },
  };
};
