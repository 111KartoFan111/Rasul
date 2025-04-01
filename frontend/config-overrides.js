const webpack = require('webpack');

module.exports = function override(config, env) {
  // Убедимся, что sourceType установлен на module
  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf = rule.oneOf.map(oneOfRule => {
        if (oneOfRule.test && oneOfRule.test.toString().includes('jsx?')) {
          oneOfRule.options.sourceType = 'module';
        }
        return oneOfRule;
      });
    }
    return rule;
  });

  config.resolve.fallback = {
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util/'),
  };

  // Добавление Buffer в глобальные переменные
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};