/**
 * Created by chenguyan on 2017/4/5.
 */
var path = require('path');

module.exports = {
    entry: { //入口
        "endtry": "./js/index.js"
    },
    output: { //出口
        path: path.join(__dirname, 'out'), //目录
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