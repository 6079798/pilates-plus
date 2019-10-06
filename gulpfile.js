const { series, parallel, src, dest, watch } = require("gulp");
const plumber = require("gulp-plumber");
const del = require("del");
const browserSync = require("browser-sync").create();
const nunjucksRender = require("gulp-nunjucks-render");
const removeEmptyLines = require("gulp-remove-empty-lines");
const postCss = require("gulp-postcss");
const cleanCss = require("gulp-clean-css");
const cssImport = require("postcss-import");
const cssMixins = require("postcss-mixins");
const cssNested = require("postcss-nested");
const cssExtend = require("postcss-extend");
const cssVars = require("postcss-css-variables");
const cssColor = require("postcss-color-function");
const mqPacker = require("css-mqpacker");
const autoprefixer = require("autoprefixer");
const objectFitImages = require("postcss-object-fit-images");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const rev = require("gulp-rev");
const revRw = require("gulp-rev-rewrite");
const revDelete = require("gulp-rev-delete-original");
const base64 = require("gulp-base64-inline");
const merge2 = require("merge2");
const concat = require("gulp-concat");
const useref = require("gulp-useref");
const gulpIf = require("gulp-if");
const size = require("gulp-size");

const srcPaths = {
  srcPath: "src",
  njk: "src/pages/*.{njk,html}",
  njkTemplates: "src/pages/includes/**/*.*",
  css: "src/css/styles.{pcss,css}",
  vendorCss: "src/css/vendor.css",
  js: "src/js",
  img: "src/img/**/*.*",
  imgInline: "../img/inline",
  copyAsIs: "src/copy/**/*.*"
};

const buildPaths = {
  buildPath: "build",
  njk: "build",
  css: "build/css",
  js: "build/js",
  img: "build/img"
};

const postCssPlugins = [
  cssImport(),
  cssMixins(),
  cssNested(),
  cssExtend(),
  cssVars(),
  cssColor(),
  autoprefixer(),
  objectFitImages(),
  mqPacker({ sort: true })
];

const isDev = !process.env.BUILD;

cleanBuildDir = () => {
  return del(buildPaths.buildPath);
};
exports.cleanBuildDir = cleanBuildDir;

njkRender = () => {
  return src(srcPaths.njk)
    .pipe(
      plumber({
        errorHandler: function(error) {
          console.log(error.message);
          this.emit("end");
        }
      })
    )
    .pipe(
      nunjucksRender({
        path: ["./src/pages/includes/"]
      })
    )
    .pipe(gulpIf(!isDev, useref()))
    .pipe(
      removeEmptyLines({
        removeComments: true
      })
    )
    .pipe(size({ showFiles: true }))
    .pipe(dest(buildPaths.njk));
};

buildCss = () => {
  return src(srcPaths.css)
    .pipe(
      plumber({
        errorHandler: function(err) {
          console.log(err);
          this.emit("end");
        }
      })
    )
    .pipe(sourcemaps.init())
    .pipe(base64(srcPaths.imgInline))
    .pipe(postCss(postCssPlugins))
    .pipe(cleanCss())
    .pipe(rename("styles.min.css"))
    .pipe(sourcemaps.write("/"))
    .pipe(size({ showFiles: true }))
    .pipe(dest(buildPaths.css))
    .pipe(browserSync.stream());
};

buildVendorCss = () => {
  return src(srcPaths.vendorCss)
    .pipe(
      plumber({
        errorHandler: function(err) {
          console.log(err);
          this.emit("end");
        }
      })
    )
    .pipe(postCss([cssImport()]))
    .pipe(cleanCss())
    .pipe(rename("vendor.min.css"))
    .pipe(size({ showFiles: true }))
    .pipe(dest(buildPaths.css));
};

concatCss = () => {
  const vendorCss = () => {
    return src(srcPaths.vendorCss).pipe(postCss([cssImport()]));
  };
  const customCss = () => {
    return src(srcPaths.css)
      .pipe(base64(srcPaths.imgInline))
      .pipe(postCss(postCssPlugins));
  };

  return merge2(vendorCss(), customCss())
    .pipe(concat("styles.min.css"))
    .pipe(cleanCss())
    .pipe(size({ showFiles: true }))
    .pipe(dest(buildPaths.css));
};

buildJs = () => {
  const webpackConfig = {
    devtool: isDev ? "source-map" : "",
    mode: isDev ? "development" : "production",
    entry: `./${srcPaths.js}/index.js`,
    output: {
      filename: "main.min.js"
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery"
      })
    ],
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /(node_modules)/,
          loader: "babel-loader",
          query: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "entry",
                  corejs: 3
                }
              ]
            ]
          }
        },
        {
          test: /\.css$/,
          loader: "ignore-loader"
        }
      ]
    }
  };

  return src(srcPaths.js)
    .pipe(plumber())
    .pipe(
      webpackStream(webpackConfig),
      webpack
    )
    .pipe(dest(buildPaths.js));
};

copyImages = () => {
  return src([srcPaths.img, "!src/img/inline/**/*.*"]).pipe(
    dest(buildPaths.img)
  );
};

copyAsIs = () => {
  return src(srcPaths.copyAsIs).pipe(dest(buildPaths.buildPath));
};

revRename = () => {
  return src(`${buildPaths.buildPath}/{css,js}/*.{css,js}`)
    .pipe(rev())
    .pipe(revDelete())
    .pipe(dest(buildPaths.buildPath))
    .pipe(rev.manifest())
    .pipe(dest(srcPaths.srcPath));
};

revRewrite = () => {
  const manifest = src(`${srcPaths.srcPath}/rev-manifest.json`);
  return src(`${buildPaths.buildPath}/*.html`)
    .pipe(revRw({ manifest }))
    .pipe(dest(buildPaths.buildPath));
};

reload = f => {
  browserSync.reload();
  f();
};

serve = () => {
  browserSync.init({
    server: buildPaths.buildPath,
    port: 3000,
    startPath: "index.html",
    notify: false
  });

  watch(
    [srcPaths.njk, srcPaths.njkTemplates],
    { events: ["change", "add"], delay: 100 },
    series(njkRender, reload)
  );

  watch([srcPaths.css], { events: ["change"], delay: 100 }, buildCss);

  watch(
    [srcPaths.vendorCss],
    { events: ["change"], delay: 100 },
    series(buildVendorCss, reload)
  );

  watch(
    [`${srcPaths.js}/**/*.js`],
    { events: ["all"], delay: 100 },
    series(buildJs, reload)
  );

  watch(
    [srcPaths.img],
    { events: ["all"], delay: 100 },
    series(copyImages, reload)
  );

  watch(
    [srcPaths.copyAsIs],
    { events: ["all"], delay: 100 },
    series(copyAsIs, reload)
  );
};

exports.build = series(
  cleanBuildDir,
  parallel(njkRender, concatCss, buildJs),
  parallel(copyImages, copyAsIs),
  revRename,
  revRewrite
);

exports.default = series(
  cleanBuildDir,
  parallel(njkRender, buildVendorCss),
  parallel(buildCss, buildJs),
  parallel(copyImages, copyAsIs),
  serve
);

exports.devRebuild = series(
  cleanBuildDir,
  parallel(njkRender, buildVendorCss),
  parallel(buildCss, buildJs),
  parallel(copyImages, copyAsIs),
);