import { registerPlugin, Ctx } from '@yank-note/runtime-api'
import { h } from 'vue'
import { parseInfo, getAttrs, applyAttrs, InfoPos } from 'markdown-it-attributes'
import Command from './markdown-theorem-command'
import State from './markdown-theorem-state'

const pluginName = 'extension-math.markdown-theorem'
const cacheState = 'extension-math.theorem-state'

const pluginRegister = async (ctx: Ctx) => {
    const fs = ctx.env.nodeRequire('fs-extra')
    const constant = await ctx.api.rpc('return require("./constant")')
    const style = await ctx.view.addStyles('')
    let state: State

    // 渲染前读取环境
    ctx.registerHook('MARKDOWN_BEFORE_RENDER', () => {
        const cache = ctx.renderer.getRenderCache(pluginName, cacheState, () => {
            let cssPath = ctx.setting.getSetting('custom-css')!
            if (cssPath.startsWith('extension:')) {
                cssPath = ctx.utils.path.join(constant.USER_EXTENSION_DIR, cssPath.slice(10))
            }
            else {
                cssPath = ctx.utils.path.join(constant.USER_THEME_DIR, cssPath)
            }

            const prefix = cssPath.slice(0, cssPath.endsWith('.min.css') ? -8 : -4)
            const dataPath = prefix + '.json'
            const genPath = prefix + '.js'

            const temp = new State(style)
            if (fs.pathExistsSync(dataPath) && fs.statSync(dataPath).isFile()) {
                ctx.lib.lodash.merge(temp.env.data, fs.readJSONSync(dataPath, { throw: false }))
            }
            if (fs.pathExistsSync(genPath) && fs.statSync(genPath).isFile()) {
                temp.env.generator = Function('env', fs.readFileSync(genPath).toString()) as any
            }

            return temp
        })
        state = ctx.lib.lodash.cloneDeep(cache)
    })

    // 添加 LaTeX 语法
    ctx.markdown.registerPlugin(md => {
        // 解析
        md.block.ruler.before('paragraph', 'theorem', (mdState, startLine, _, silent) => {
            state.parser.bind(mdState, startLine)

            // 匹配命令
            const cmd = state.parser.matchCommand()
            if (cmd === null) {
                return false
            }
            const pattern = Command.getPattern(cmd)
            if (pattern === null) {
                return false
            }
            state.parser.skipSpaces()

            // 匹配参数
            const args = state.parser.matchPattern(pattern)
            if (args === null) {
                console.error(`命令 ${cmd} 参数匹配失败`)
                return false
            }
            if (!state.parser.isEOL()) {
                console.error(`命令 ${cmd} 后存在多余字符`)
                return false
            }

            if (silent) {
                return true
            }

            // 执行命令
            state.range = [startLine, state.parser.line]
            if (!Command.execute(cmd, args, state)) {
                console.error(`命令 ${cmd} 执行失败`)
                return false
            }
            mdState.line += state.parser.line - startLine + 1

            return true
        }, { alt: ['paragraph'] })

        md.core.ruler.after('block', 'apply_env', () => {
            state.apply()
        })

        // 渲染
        const attrOpts = { leftDelimiter: '{', rightDelimiter: '}', allowedAttributes: [] }
        md.renderer.rules.theorem_open = (tokens, index, options) => {
            const openToken = tokens[index]
            const attrToken = tokens[openToken.meta.closeTokenIndex + 2]

            if (attrToken !== undefined && attrToken.type === 'inline' && attrToken.hidden) {
                const info = parseInfo(attrOpts, attrToken.content)
                if (info !== null && info.pos === InfoPos.WHOLE) {
                    applyAttrs(attrOpts, openToken, getAttrs(info.exp))
                }
            }

            return md.renderer.renderToken(tokens, index, options)
        }

        md.renderer.rules.theorem_info = (tokens, index, _, env) => {
            const token = tokens[index]

            if (token.content === '') {
                return h('div', { class: 'theorem-info empty' }, h('span', { class: 'content' }, ''))
            }

            md.core.ruler.disable('footnote_tail')
            const nodes = md.renderInline(token.content, env)
            md.core.ruler.enable('footnote_tail')

            return h('div', { class: 'theorem-info' }, h('span', { class: 'content' }, nodes)) as any
        }
    })

    // 添加语法补全项
    ctx.editor.tapSimpleCompletionItems(items => {
        Object.assign(
            items.find(i => i.label === '/ \\begin KaTeX Environment')!,
            { label: '/ \\begin', insertText: '\\begin{$1}\n$2\n\\end{$1}' }
        )

        items.push(
            { label: '/ \\end', insertText: '\\end{$1}', block: true },
            { label: '/ \\newtheorem', insertText: '\\newtheorem{$1}{$2}[$3]\n\\settheorem{$1}{$4}', block: true },
            { label: '/ \\settheorem', insertText: '\\settheorem{$1}{$2}', block: true },
            { label: '/ \\setcounter', insertText: '\\setcounter{$1}{$2}', block: true },
        )
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })