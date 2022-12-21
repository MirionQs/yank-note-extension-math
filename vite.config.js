"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var path = require("path");
var vite_1 = require("vite");
var plugin_vue_1 = require("@vitejs/plugin-vue");
var runtime_api_1 = require("@yank-note/runtime-api");
var OUT_DIR = 'dist/';
// https://vitejs.dev/config/
exports["default"] = (0, vite_1.defineConfig)({
    base: path.join((0, runtime_api_1.getExtensionBasePath)(process.env.npm_package_name), OUT_DIR).replace(/\\/g, '/'),
    plugins: [(0, plugin_vue_1["default"])()],
    define: {
        __EXTENSION_VERSION__: JSON.stringify(process.env.npm_package_version),
        __EXTENSION_ID__: JSON.stringify(process.env.npm_package_name)
    },
    resolve: {
        alias: [
            { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
        ]
    },
    build: {
        minify: 'terser',
        lib: {
            entry: path.resolve(__dirname, 'src/main.ts'),
            formats: ['iife'],
            name: process.env.npm_package_name.replace(/[^a-zA-Z0-9_]/g, '_'),
            fileName: function () { return 'index.js'; }
        },
        outDir: OUT_DIR,
        rollupOptions: {
            external: Object.keys(runtime_api_1.YN_LIBS),
            output: {
                globals: __assign({ window: 'window' }, runtime_api_1.YN_LIBS)
            }
        }
    }
});
