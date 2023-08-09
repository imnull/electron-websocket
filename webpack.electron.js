const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = (options) => {
    return {
        mode: 'production',
        target: 'electron-main',
        entry: {
            main: './electron/main.ts'
        },
        output: {
            path: path.resolve('electron-dist/electron'),
            filename: '[name].js',
            libraryTarget: 'commonjs',
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
                    ],
                },
            ]

        },
        plugins: [
           new CleanWebpackPlugin(),
        ]
    }
}