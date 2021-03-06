/* eslint global-require:off, no-console:off */
process.traceDeprecation = true;

const path = require('path');
const webpack = require('webpack');
const chalk = require('chalk');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const DEV_MODE = process.env.NODE_ENV === 'development';
const colorFun = DEV_MODE ? chalk.black.bgYellow : chalk.bgCyan.white;

console.log(colorFun(`DEV_MODE = ${DEV_MODE} , process.env.NODE_ENV = ${process.env.NODE_ENV}`));
const toFilename = (name, ext = 'js') => {
    const units = [name, '.', ext];
    if (!DEV_MODE) {
        const hashStr = (ext === 'css' ? '-[contenthash]' : '-[chunkhash]');
        units.splice(1, 0, hashStr);
    }
    return units.join('');
};

const config = {
    context: path.resolve('src'),
    entry: {
        app: ['babel-polyfill','./js/app.js'],
        vendor: [
            'es6-promise/auto',
            'vue',
            'vue-router',
            'vuex'
        ],
    },
    output: {
        filename: toFilename('asset/js/[name]'),
        chunkFilename: toFilename('asset/js/[name]'),
        path: path.resolve(__dirname, './dist'),
        publicPath: './',
    },
    // 'cheap-module-eval-source-map'; // 這會抓到 stylus, scss mixin 裡的路徑
    //  "inline-source-map";   // 要用這個才會對
    devtool: DEV_MODE ? 'inline-source-map' : false,
    resolve: {
        alias: {
            // vue$: 'vue/dist/vue.esm.js',
        },
        modules: [
            path.resolve('src/component'),
            path.resolve('src/css'),
            path.resolve('src/js'),
            path.resolve('src'),
            path.resolve('node_modules'),
        ],
        extensions: ['.js'],
    },
    devServer: {
        hot: true,
        historyApiFallback: true,
        stats: {
            colors: true,
            hash: false,
            chunks: false,
            chunkModules: false,
        },
    },
};
config.module = {
    rules: [
        {
            test: /\.vue$/,
            loader: 'vue-loader',
            include: path.resolve('src/component'),
            exclude: /node_modules/,
            options: {
                postcss: [
                    require('autoprefixer')({
                        browsers: ['last 5 version', 'iOS >=8', 'Safari >=8'],
                    }),
                    require('cssnano')({
                        zindex: false,
                        calc: false,
                        reduceIdents: false,
                    }),
                ],
            },
        },
        {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [
                path.resolve('src/js'),
                path.resolve('src/lib')
            ],
            exclude: /node_modules/
        },
        {
            test: /\.styl$/,
            use: [
                'style-loader',
                'css-loader?camelCase&modules&importLoaders=1&localIdentName=[local]---[hash:base64:5]',
                'stylus-loader'
            ]
        },
        {
            test: /\.css$/,
            loaders: 'style-loader!css-loader'
        },
        {
            test: /\.(png|jpg|gif|svg|ico)$/,
            include: path.resolve('src/img'),
            loader: 'url-loader',
            exclude: /node_modules/,
            options: {
                limit: 1024,
                name: 'asset/[path][name].[ext]?[hash:8]',
            },
        },
        {
            test: /\.pug$/,
            loader: 'pug-loader',
            options: {
                pretty: true,
                self: true,
            }
        },
        {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "url-loader?limit=10000&mimetype=application/font-woff"
        },
        {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "file-loader"
        }
    ]
};

config.plugins = [
    // copy src/copy 下所有檔案，放到 dist 下
    copyWebpackPlugin([
        //{ from: 'copy', to: './' },
        //{ from: 'img', to: './img' }
        //{ from: 'lib', to: './lib' }
    ]),
    // 產生 html , 並注入script tag app.js?[hash]
    new HtmlWebpackPlugin({
        template: 'html/index.template.pug',
        data: { // 傳變數給 .pug
            DEV_MODE,
        },
    }),
    // 注入 script app.js , 並加入 defer 屬性
    new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'defer',
    }),
    new webpack.DefinePlugin({
        __DEV__: DEV_MODE,
        'process.env': {
            NODE_ENV: JSON.stringify(DEV_MODE ? 'development' : 'production'),
        },
    }),
    //  http://vue-loader.vuejs.org/en/workflow/production.html
    ...DEV_MODE ? [
        new webpack.HotModuleReplacementPlugin(),
    ] : [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false,
            },
        }),
    ],
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
    })
];
module.exports = config;
