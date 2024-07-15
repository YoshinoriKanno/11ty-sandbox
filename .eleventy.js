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
    if (!fs.existsSync(outputImagesDir)) {
      fs.mkdirSync(outputImagesDir, { recursive: true });
    }

    const imageFiles = fs.readdirSync(imagesDir);
    for (const file of imageFiles) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(outputImagesDir, file);

      try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        if (metadata.format === 'jpeg') {
          await image
            .resize({ width: 800 }) // 必要に応じてサイズを調整
            .jpeg({ quality: 60 }) // JPEG の品質を設定
            .toFile(outputPath);
          console.log(`Compressed ${file} as JPEG`);
        } else if (metadata.format === 'png') {
          await image
            .resize({ width: 800 }) // 必要に応じてサイズを調整
            .png({ compressionLevel: 9 }) // PNG の品質を設定
            .toFile(outputPath);
          console.log(`Compressed ${file} as PNG`);
        } else {
          // 他のフォーマットの場合、そのままコピー
          await fs.promises.copyFile(inputPath, outputPath);
          console.log(`Copied ${file} without compression`);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  });

  // JavaScript ファイルを src/scripts から dist/scripts にコピーする設定を追加
  eleventyConfig.addPassthroughCopy({ 'src/scripts/**/*.js': 'scripts' });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
    },
  };
};
