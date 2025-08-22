const createExpoWebpackConfigAsync = require('@expo/webpack-config');
module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.devtool = 'source-map';
  config.plugins = (config.plugins || []).filter(
    p => !(p && p.constructor && p.constructor.name === 'EvalSourceMapDevToolPlugin')
  );
  return config;
};
