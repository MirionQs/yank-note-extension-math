import { registerPlugin, Ctx } from '@yank-note/runtime-api'
import Command from './markdown-theorem-command'
import State from './markdown-theorem-state'

const fs = nodeRequire('fs-extra')

const pluginName = 'extension-math.markdown-theorem'
const cacheState = 'extension-math.theorem-state'

const pluginRegister = async (ctx: Ctx) => {
    const constant = await ctx.api.rpc('return require("./constant")')
    const style = await ctx.view.addStyles('')
    let state: State

    // 渲染前读取环境
    ctx.registerHook('MARKDOWN_BEFORE_RENDER', () => {
        const cache = ctx.renderer.getRenderCache(pluginName, cacheState, () => {
            const temp = new State(style)

            let cssPath = ctx.setting.getSetting('custom-css')!
            if (cssPath.startsWith('extension:')) {
                cssPath = ctx.utils.path.join(constant.USER_EXTENSION_DIR, cssPath.slice(10))
            }
            else {
                cssPath = ctx.utils.path.join(constant.USER_THEME_DIR, cssPath)
            }

            const css = fs.readFileSync(cssPath).toString().replaceAll('\r\n', '\n')
            temp.environment.load(css)

            return temp
        })
        state = ctx.lib.lodash.cloneDeep(cache)
    })

    // 添加 LaTeX 语法
    ctx.markdown.registerPlugin(md => {
        md.block.ruler.before('paragraph', 'theorem', (mdState, startLine, _, silent) => {
            state.bind(mdState, startLine)

            // 匹配命令
            const cmd = state.parser.matchCommand()
            if (cmd === null) {
                return false
            }
            const pattern = Command.getPattern(cmd)
            if (pattern === null) {
                state.error('匹配命令', `未知命令 '${cmd}'`)
                return false
            }
            state.parser.skipSpaces()

            // 匹配参数
            const args = state.parser.matchPattern(pattern)
            if (args === null) {
                state.error(cmd, '参数匹配失败')
                return false
            }
            state.parser.skipSpaces()

            if (!state.parser.isEOL()) {
                state.error(cmd, '末尾存在多余字符')
                return false
            }

            if (silent) {
                return true
            }

            // 执行命令
            state.range = [startLine, state.parser.line]
            if (!Command.execute(cmd, args, state)) {
                state.error(cmd, '命令执行失败')
                return false
            }
            mdState.line += state.parser.line - startLine + 1

            return true
        }, { alt: ['paragraph'] })
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })