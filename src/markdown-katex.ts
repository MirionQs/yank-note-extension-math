import { registerPlugin } from "@yank-note/runtime-api"

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const pluginName = 'extension-math.markdown-katex'
const idOpenConfig = 'extension-math.open-katex-config'

const defaultOpts = {
    throwOnError: false,
    errorColor: '#f00',
    strict: false,
    trust: true,
    globalGroup: true,
    output: 'html'
}

export default () => {
    registerPlugin({
        name: pluginName,
        register: async ctx => {
            const constant = await ctx.api.rpc('return require("./constant")')
            const configPath = path.join(constant.USER_DIR, 'katex-config.json')
            let options: any

            // 渲染前读取配置
            ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
                const configOpts = fs.readJsonSync(configPath, { throw: false }) ?? {}
                const fmOpts = env.attributes?.katex ?? {}
                const macros = Object.assign({}, configOpts.macros, fmOpts.macros)

                options = Object.assign({}, defaultOpts, configOpts, fmOpts, { macros })
            })

            // 插入自定义配置
            ctx.registerHook('PLUGIN_HOOK', ({ plugin, type, payload }) => {
                if (plugin === 'markdown-katex' && type === 'before-render') {
                    Object.assign(payload.options, options)
                    if (payload.options.keepDisplayMode && !payload.options.displayMode) {
                        payload.latex = '\\displaystyle ' + payload.latex
                    }
                }
            })

            // 命令面板
            ctx.editor.whenEditorReady().then(({ editor }) => {
                editor.addAction({
                    id: idOpenConfig,
                    label: 'math: 打开 KaTeX 配置文件',
                    run: () => {
                        ctx.base.openPath(configPath)
                    }
                })
            })

            fs.ensureFileSync(configPath) // 确保配置文件存在
            ctx.view.refresh() // 首次渲染不应用扩展，需要刷新
        }
    })
}