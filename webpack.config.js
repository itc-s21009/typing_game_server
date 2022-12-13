module.exports = {
    entry: './src/index.js',
    mode: "development",
    output: {
        path: `${__dirname}/public`,
        filename: 'main.js'
    },
    devServer: {
        static: 'public',
    }
}