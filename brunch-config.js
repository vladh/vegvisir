exports.files = {
  javascripts: {
    joinTo: {
      'vendor.js': /^(?!app)/,
      'app.js': /^app/,
    },
  },
  stylesheets: {
    joinTo: {
      'vendor.css': /^(?!app)/,
      'app.css': /^app/,
    },
  },
}

exports.plugins = {
  babel: {presets: ['env']},
  pug: {pugRuntime: false},
}

exports.npm = {
  aliases: {
    vue: 'vue/dist/vue.js',
    d3: 'd3/build/d3.min.js',
  },
}

exports.conventions = {
  ignored: /includes/,
}
