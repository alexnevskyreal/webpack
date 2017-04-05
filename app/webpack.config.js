/**
 * Created by chenguyan on 2017/4/5.
 */
var path = require('path');
module.exports = {
    entry: {
        "endtry": "./index.js"
    },
    output: {
        path: path.join(__dirname, 'out'),
        filename: "[name].bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader:"css-loader"
            },
            {
                test: /\.png$/,
                loader: "file-loader"
            }
        ]
    }
};