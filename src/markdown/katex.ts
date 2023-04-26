import { registerPlugin } from "@yank-note/runtime-api"

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const name = 'extension-math.markdown.katex'
const actionOpen = 'extension-math.open-config'

const defaultOptions = {
    throwOnError: false,
    errorColor: '#f00',
    globalGroup: true,
    trust: true,
    output: 'html',
    strict: false
}

export default () => {
    registerPlugin({
        name,
        register: async ctx => {
            const constant = await ctx.api.rpc('return require("./constant")')
            const configPath = path.join(constant.USER_DIR, 'katex-config.json')
            let options: any

            /**
             * 读取配置文件
             * @param filePath 配置文件路径
             * @returns 配置
             */
            const readConfig = (filePath: string) => {
                if (!path.isAbsolute(filePath)) {
                    filePath = path.join(path.dirname(ctx.store.state.currentFile!.absolutePath), filePath)
                }
                try {
                    return fs.readJsonSync(filePath)
                }
                catch {
                    console.error(`[${name}] KaTeX 配置文件读取失败，位于 ${filePath}`)
                    return {}
                }
            }

            /**
             * 合并配置
             * @param target 合并对象
             * @param source 合并源
             */
            const mergeOptions = (target: any, source: any) => {
                const macros = Object.assign(target.macros, source.macros)
                Object.assign(target, source)
                target.macros = macros
            }

            // 渲染前读取配置
            ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
                options = Object.assign({}, defaultOptions, readConfig(configPath))

                // 读取前言中引用的配置
                const fmOpts = env.attributes?.katex ?? {}
                for (const filePath of fmOpts.import ?? []) {
                    mergeOptions(options, readConfig(filePath))
                }

                mergeOptions(options, fmOpts)
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
                    id: actionOpen,
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