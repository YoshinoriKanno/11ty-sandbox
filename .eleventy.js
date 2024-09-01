const sass = require('sass');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = function (eleventyConfig) {
  // SassやTypeScriptファイルの変更を監視
  eleventyConfig.addWatchTarget('./src/styles/');
  eleventyConfig.addWatchTarget('./src/scripts/');
  eleventyConfig.addWatchTarget('./src/tailwind.css'); // Tailwind CSSの入力ファイルも監視

  let processedImages = new Set();

  eleventyConfig.on('beforeBuild', async () => {
    // ここで Tailwind CSS をビルド
    await buildTailwindCSS();

    // Sass ファイルをコンパイルして CSS ファイルを出力
    const sassOutputDir = 'dist/styles';
    const sassResult = sass.renderSync({ file: 'src/styles/main.scss' });
    fs.writeFileSync(path.join(sassOutputDir, 'main.css'), sassResult.css);

    // 画像処理を変更時にのみ実行
    const imagesDir = 'src/assets/images';
    const outputImagesDir = 'dist/images';

    await processImages(imagesDir, outputImagesDir);
  });

  const buildTailwindCSS = async () => {
    const tailwindInputPath = 'src/tailwind.css';
    const tailwindOutputDir = 'dist/styles';
    const tailwindOutputPath = path.join(tailwindOutputDir, 'tailwind.css');

    if (!fs.existsSync(tailwindOutputDir)) {
      fs.mkdirSync(tailwindOutputDir, { recursive: true });
    }

    const tailwindInputCSS = fs.readFileSync(tailwindInputPath, 'utf8');
    const tailwindProcessed = await postcss([tailwindcss, autoprefixer])
      .process(tailwindInputCSS, { from: tailwindInputPath, to: tailwindOutputPath })
      .then(result => {
        result.warnings().forEach(warn => {
          console.warn(warn.toString());
        });
        return result.css;
      });

    fs.writeFileSync(tailwindOutputPath, tailwindProcessed);
    console.log(`Tailwind CSS built at ${tailwindOutputPath}`);
  };

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

  eleventyConfig.addPassthroughCopy({ 'src/scripts/**/*.js': 'scripts' });

  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("src/blog/_posts/*.md").reverse();
  });

  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: async (err, bs) => {
        await buildTailwindCSS();
        bs.reload();
      }
    }
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
    },
  };
};
