import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const pluginName = 'extension-math.markdown-katex'
const actionOpenConfig = 'extension-math.open-katex-config'
const cacheOptions = 'extension-math.katex-options'

const defaultOpts = {
    throwOnError: false,
    errorColor: '#f00',
    strict: false,
    trust: true,
    globalGroup: true,
    output: 'html'
}

const pluginRegister = async (ctx: Ctx) => {
    const constant = await ctx.api.rpc('return require("./constant")')
    const configPath = path.join(constant.USER_DIR, 'katex-config.json')
    let options

    // 渲染前读取配置
    // 前言配置 > 文件配置 > 默认配置
    ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
        const cache = ctx.renderer.getRenderCache(pluginName, cacheOptions, () => {
            return Object.assign({}, defaultOpts, fs.readJsonSync(configPath, { throw: false }) ?? {})
        })
        const fmOpts = env.attributes?.katex ?? {}
        const macros = Object.assign({}, cache.macros, fmOpts.macros)

        options = Object.assign({}, cache, fmOpts, { macros })
    })

    // 注入 LaTeX
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
            id: actionOpenConfig,
            label: 'math: 打开 KaTeX 配置文件',
            run: () => {
                fs.ensureFileSync(configPath)
                ctx.base.openPath(configPath)
            }
        })
    })

    // 刷新 KaTeX 缓存
    ctx.view.refresh()
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })