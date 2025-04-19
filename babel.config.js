module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 必要に応じて他のプラグインを追加
    ],
  };
};
