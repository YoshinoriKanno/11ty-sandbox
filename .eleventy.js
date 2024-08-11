const sass = require('sass');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function (eleventyConfig) {
  eleventyConfig.on('beforeBuild', async () => {
    // Sass ファイルをコンパイルして CSS ファイルを出力
    const outputDir = 'dist/styles';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const result = sass.renderSync({ file: 'src/styles/main.scss' });
    fs.writeFileSync(path.join(outputDir, 'main.css'), result.css);

    // TypeScript ファイルをコンパイルして JS ファイルを出力
    execSync('npx tsc', { stdio: 'inherit' });

    // 画像ファイルを圧縮して dist/images に出力
    const imagesDir = 'src/assets/images';
    const outputImagesDir = 'dist/images';

    const processImages = async (inputDir, outputDir) => {
      const entries = await fs.promises.readdir(inputDir, { withFileTypes: true });

      for (const entry of entries) {
        const inputPath = path.join(inputDir, entry.name);
        const outputPath = path.join(outputDir, entry.name);

        if (entry.isDirectory()) {
          // ディレクトリなら再帰的に処理
          if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
          }
          await processImages(inputPath, outputPath);
        } else {
          // ファイルなら画像を処理
          try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
              await image
                .jpeg({ quality: 60 }) // JPEG の品質を設定
                .toFile(outputPath);
              console.log(`Compressed ${entry.name} as JPEG`);
            } else if (metadata.format === 'png') {
              await image
                .png({ quality: 65 }) // PNG の品質を設定
                .toFile(outputPath);
              console.log(`Compressed ${entry.name} as PNG`);
            } else {
              // 他のフォーマットの場合、そのままコピー
              await fs.promises.copyFile(inputPath, outputPath);
              console.log(`Copied ${entry.name} without compression`);
            }
          } catch (err) {
            console.error(`Error processing ${entry.name}:`, err);
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
