import { registerPlugin, Ctx } from '@yank-note/runtime-api'
import { h } from 'vue'
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
            const dataPath = cssPath.slice(0, -3) + 'json'
            const genPath = cssPath.slice(0, -3) + 'js'

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
        state.apply()
    })

    // 添加 LaTeX 语法
    ctx.markdown.registerPlugin(md => {
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

        md.renderer.rules.apply_env = (tokens, index) => {
            if (!tokens[index].hidden) {
                state.apply()
            }
            return ''
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
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })