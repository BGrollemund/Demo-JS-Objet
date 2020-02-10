const path = require('path');
const HtmlWebpackConfig = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackConfig( {
            template: "src/index.ejs"
        })
    ],
    resolve: {
        extensions: [ '.ts', '.js', '.json' ],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /style\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }

                ]
            },
            {
                test: '/\.css$/',
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(?:jpe?g|png|gif)$/,
                use: 'file-loader'
            }
        ]
    }
};