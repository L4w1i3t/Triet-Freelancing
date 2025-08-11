module.exports = {
  plugins: [
    require("autoprefixer")({
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "Firefox ESR",
        "not dead",
        "not ie 11",
      ],
    }),
    require("cssnano")({
      preset: [
        "default",
        {
          discardComments: {
            removeAll: true,
          },
          minifyFontValues: {
            removeQuotes: false,
          },
          normalizeUrl: false,
          discardUnused: false,
          mergeIdents: false,
          reduceIdents: false,
          safe: true,
        },
      ],
    }),
  ],
};
