const path = require("path");

module.exports = {
    entry: './src/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                },
                exclude: /node_modules/,
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [
            path.resolve(__dirname + '/src'),
            path.resolve(__dirname + '/node_modules')
        ],
        // alias: {
        //     '@config': path.resolve(__dirname, '/config')
        // }
        // alias: {
        //     ['$']: path.resolve(__dirname),
        //     ['~']: path.resolve(__dirname + "/src")
        // }
    }
}