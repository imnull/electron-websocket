const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = (options) => {

    const {
        WEBPACK_SERVE = false,
        target = 'web',
    } = options

    const entry = './web/index'

    return {
        mode: 'production',
        target: 'electron-renderer',
        entry: {
            main: './electron/main.ts'
        },
        output: {
            path: path.resolve('electron-dist/electron'),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['.ts', '.js'],
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
            ]

        },
        plugins: [
           new CleanWebpackPlugin(),
        ]
    }
}