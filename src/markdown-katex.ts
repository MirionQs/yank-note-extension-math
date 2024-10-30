import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.markdown-katex'
const settingKeepDisplay = 'extension-math.keep-display'
const actionOpenConfig = 'extension-math.open-katex-config'
const cacheOptions = 'extension-math.katex-options'

const defaultKeepDisplay = false

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

    // 设置面板
    ctx.setting.changeSchema(schema => {
        schema.properties[settingKeepDisplay] = {
            title: '默认以行间模式渲染公式',
            group: 'render',
            type: 'boolean',
            format: 'checkbox',
            defaultValue: defaultKeepDisplay
        }
    })

    // 更改设置后刷新
    ctx.registerHook('SETTING_CHANGED', ({ changedKeys }) => {
        if (changedKeys.includes(settingKeepDisplay as any)) {
            ctx.view.refresh()
        }
    })

    // 命令面板
    ctx.editor.whenEditorReady().then(({ editor }) => {
        editor.addAction({
            id: actionOpenConfig,
            label: 'math: 打开 KaTeX 配置文件',
            run: () => {
                ctx.base.openPath(configPath)
            }
        })
    })

    // 注入 LaTeX
    ctx.markdown.registerPlugin(md => {
        const defaultRenderer = (tokens, index, options, _, __) => md.renderer.renderToken(tokens, index, options)
        const defaultRule: any = {};
        [
            'strong_open',
            'strong_close',
            'math_inline'
        ].forEach(type => defaultRule[type] = md.renderer.rules[type] ?? defaultRenderer)

        let bold = false
        md.renderer.rules.strong_open = (tokens, index, options, env, self) => {
            bold = true
            return defaultRule.strong_open(tokens, index, options, env, self)
        }
        md.renderer.rules.strong_close = (tokens, index, options, env, self) => {
            bold = false
            return defaultRule.strong_close(tokens, index, options, env, self)
        }

        md.renderer.rules.math_inline = (tokens, index, options, env, self) => {
            const token = tokens[index]

            if (bold) {
                token.content = '\\bm{' + token.content + '}'
            }
            if (ctx.setting.getSetting(settingKeepDisplay)) {
                token.content = '\\displaystyle ' + token.content
            }

            return defaultRule.math_inline(tokens, index, options, env, self)
        }
    })

    // 确保配置文件存在
    if (!fs.pathExistsSync(configPath)) {
        fs.writeFileSync(configPath, '{}')
    }

    // 刷新 KaTeX 缓存
    ctx.view.refresh()
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })