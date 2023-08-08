const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = (options) => {

    const {
        WEBPACK_SERVE = false,
        target = 'web',
    } = options

    const entry = './web/index'
    const mode = WEBPACK_SERVE ? 'development' : 'production'
    const outpath = target === 'web' ? 'web-dist' : 'electron-dist/web'

    return {
        mode,
        entry,
        output: {
            path: path.resolve(outpath),
            filename: 'index.js',
            // libraryTarget: 'commonjs',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
            alias: {
                '~': './src'
            }
        },
        module: {
            rules: [
                {
                    test: /\.[jt]sx?$/i,
                    use: [
                        {
                            loader: 'esbuild-loader',
                        }
                    ]
                },
                {
                    test: /\.(css|s[ca]ss)/i,
                    use: ['css-loader', 'style-loader', 'sass-loader'],
                }
            ]

        },
        plugins: [
           new CleanWebpackPlugin(),
           new HtmlWebpackPlugin({
                template: path.resolve('web/template.html'),
                filename: 'index.html',
                hash: true,
                inject: 'body',
            }),
        ],
        devServer: {
            port: 9011,
        }
    }
}