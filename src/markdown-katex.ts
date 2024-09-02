import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.markdown-katex'
const actionOpenConfig = 'extension-math.open-katex-config'
const cacheOptions = 'extension-math.katex-options'

const defaultOpts = {
    output: 'html',
    throwOnError: false,
    errorColor: '#f00',
    strict: false,
    trust: true,
    globalGroup: true,
}

const pluginRegister = async (ctx: Ctx) => {
    const fs = ctx.env.nodeRequire('fs-extra')
    const constant = await ctx.api.rpc('return require("./constant")')
    const configPath = ctx.utils.path.join(constant.USER_DIR, 'katex-config.json')

    // 渲染前读取配置
    // 前言配置 > 文件配置 > 默认配置
    ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
        const cache = ctx.renderer.getRenderCache(pluginName, cacheOptions, () => {
            return ctx.lib.lodash.merge({}, defaultOpts, fs.readJsonSync(configPath, { throw: false }))
        })
        env.attributes ??= {}
        env.attributes.katex = ctx.lib.lodash.merge({}, cache, env.attributes.katex)
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

    // 注入 LaTeX
    ctx.markdown.registerPlugin(md => {
        const defaultRule = md.renderer.rules.math_inline!

        md.renderer.rules.math_inline = (tokens, index, options, env, self) => {
            const token = tokens[index]
            if (env.attributes.katex.keepDisplayMode) {
                token.content = '\\displaystyle ' + token.content
            }
            return defaultRule(tokens, index, options, env, self)
        }
    })

    // 刷新 KaTeX 缓存
    ctx.view.refresh()
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })