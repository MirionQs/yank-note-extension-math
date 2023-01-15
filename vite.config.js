"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const vite_1 = require("vite");
const plugin_vue_1 = __importDefault(require("@vitejs/plugin-vue"));
const runtime_api_1 = require("@yank-note/runtime-api");
const OUT_DIR = 'dist/';
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    base: path.join((0, runtime_api_1.getExtensionBasePath)(process.env.npm_package_name), OUT_DIR).replace(/\\/g, '/'),
    plugins: [(0, plugin_vue_1.default)()],
    define: {
        __EXTENSION_VERSION__: JSON.stringify(process.env.npm_package_version),
        __EXTENSION_ID__: JSON.stringify(process.env.npm_package_name),
    },
    resolve: {
        alias: [
            { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
        ],
    },
    build: {
        minify: 'terser',
        lib: {
            entry: path.resolve(__dirname, 'src/main.ts'),
            formats: ['iife'],
            name: process.env.npm_package_name.replace(/[^a-zA-Z0-9_]/g, '_'),
            fileName: () => 'index.js',
        },
        outDir: OUT_DIR,
        rollupOptions: {
            external: Object.keys(runtime_api_1.YN_LIBS),
            output: {
                globals: Object.assign({ window: 'window' }, runtime_api_1.YN_LIBS)
            }
        }
    },
});
