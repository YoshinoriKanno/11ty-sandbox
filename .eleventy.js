const sass = require('sass');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function (eleventyConfig) {
  eleventyConfig.on('beforeBuild', () => {
    // Sass ファイルをコンパイルして CSS ファイルを出力
    const outputDir = 'dist/styles';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const result = sass.renderSync({ file: 'src/styles/main.scss' });
    fs.writeFileSync(path.join(outputDir, 'main.css'), result.css);

    // TypeScript ファイルをコンパイルして JS ファイルを出力
    execSync('npx tsc', { stdio: 'inherit' });
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
