import { registerPlugin } from '@yank-note/runtime-api'
import Parser from './markdown-math-env-parser'

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const pluginName = 'extension-math.markdown-math-env'

type Command = {
    form: number | string | (number | string)[],
    run: (args: string[], data: any) => boolean
}

type Environment = {
    text: string,
    counter?: {
        identifier?: string,
        level?: number
    },
    [attr: string]: any
}

type Commands = Record<string, Command>
type Environments = Record<string, Environment>

export default () => {
    registerPlugin({
        name: pluginName,
        register: async ctx => {
            const constant = await ctx.api.rpc('return require("./constant")')
            const style = await ctx.view.addStyles('')
            const styleNumber: string[] = [] // 'counter(h2counter)'.'counter(h3counter)'.'...'
            let presetEnvironment: Environments
            let environment: Environments
            let template: string
            let debug: boolean

            // 生成固定样式
            styleNumber[1] = ''
            for (let l = 2; l <= 6; ++l) {
                styleNumber[l] = styleNumber[l - 1] + `counter(h${l}counter) '.'`
            }

            /**
             * 打印错误信息
             * @param title 标题
             * @param content 内容
             * @param location 位置，为数字时则代表行数，打印时会自动+1，为字符串时则代表所在项，会直接输出
             */
            const printErrorMessage = (title: string, content: string, location?: number | string) => {
                if (!debug) {
                    return
                }

                let message = ''
                if (title !== '') {
                    message = `${title}: `
                }
                message += content
                if (typeof location === 'number') {
                    message += `, 位于行 ${location + 1}`
                }
                else if (typeof location === 'string') {
                    message += `, 位于项 ${location}`
                }

                console.error(message)
            }

            /**
             * 规范化环境属性，填充缺省值并删除非法环境
             * @param envs 要规范化的环境
             * @returns 如果所有环境都是合法的则返回 `true` ，反之返回 `false`
             */
            const normalizeEnvAttributes = (envs: Environments) => {
                let result = true

                for (const name in envs) {
                    if (!/[a-zA-Z@]+/.test(name)) {
                        result = false
                        delete envs[name]
                        continue
                    }

                    const identifier = (envs[name].counter?.identifier ?? name).replaceAll('@', '-')
                    const level = envs[name].counter?.level ?? envs[identifier]?.counter?.level ?? 0

                    if (!/[a-zA-Z-]+/.test(identifier) ||
                        !(Number.isInteger(level) && 0 <= level && level <= 6)) {
                        result = false
                        delete envs[name]
                        continue
                    }

                    envs[name].counter = { identifier, level }
                }

                return result
            }

            /**
             * 推入一个标记
             * @param state 解析器状态
             * @param type 标记类型
             * @param tag HTML 标签
             * @param nesting 标签开闭
             * @param map 源码范围
             * @param attrs HTML 属性
             * @param content HTML 内容
             * @returns 推入的标记
             */
            const pushToken = (
                state: any,
                type: string,
                tag: string,
                nesting: -1 | 0 | 1,
                map: [number, number] | null = null,
                attrs: [string, string][] | null = null,
            ) => {
                const token = state.push(type, tag, nesting)
                Object.assign(token, { map, attrs })
                if (type === 'inline') {
                    token.children = []
                }
                return token
            }

            /**
             * 读取预设
             */
            const readPreset = async () => {
                // 读取样式文件
                let themePath = ctx.setting.getSetting('custom-css')!
                if (themePath.startsWith('extension:')) {
                    themePath = path.join(constant.USER_EXTENSION_DIR, themePath.slice(10))
                }
                else {
                    themePath = path.join(constant.USER_THEME_DIR, themePath)
                }

                const css: string = fs.readFileSync(themePath).toString().replaceAll('\r\n', '\n')

                // 读取样式模板
                template = ''

                let left = css.indexOf('/* MathEnv Template\n')
                if (left !== -1) {
                    const right = css.indexOf('\n*/', left)
                    template = css.slice(left + 20, right)
                }

                // 读取预设环境
                presetEnvironment = {}

                left = css.indexOf('/* MathEnv Environment\n')
                if (left !== -1) {
                    const right = css.indexOf('\n*/', left)
                    try {
                        presetEnvironment = JSON.parse(css.slice(left + 23, right))
                    } catch {
                        printErrorMessage('读取预设环境', 'JSON 解析失败')
                        presetEnvironment = {}
                    }
                }

                if (!normalizeEnvAttributes(presetEnvironment)) {
                    printErrorMessage('读取预设环境', '存在非法环境')
                }

                updateStyle(presetEnvironment)
            }

            /**
             * 更新样式
             * @param envs 使用的环境
             */
            const updateStyle = (envs: Environments) => {
                const levels: string[][] = [[], ['h2counter'], ['h3counter'], ['h4counter'], ['h5counter'], ['h6counter'], []]

                style.innerHTML = `
                    .skip-number:not([math-env-title])::before {
                        display: none !important;
                    }

                    [math-env] {
                        margin: 1em 0;
                    }

                    [math-env-title] {
                        display: inline-block;
                    }

                    [math-env-title] + p {
                        display: inline;
                    }

                    [math-env-title]::after {
                        content: '.';
                    }
                `

                for (const name in envs) {
                    const { level, identifier } = envs[name].counter!

                    levels[level!].push(identifier!)

                    // 计数器增加
                    let number = ''
                    if (level! > 0) {
                        number = `' ' ${styleNumber[level!]} counter(${identifier})`
                    }
                    style.innerHTML += `
                        [math-env-title='${name}'].skip-number::before {
                            content: '${envs[name].text}';
                        }

                        [math-env-title='${name}']:not(.skip-number)::before {
                            content: '${envs[name].text}' ${number};
                            counter-increment: ${identifier};
                        }
                    `

                    // 应用样式模板
                    style.innerHTML += Function('name', 'attr', template)(name, envs[name])
                }

                // 计数器重置
                for (let l = 1; l <= 5; ++l) {
                    style.innerHTML += `
                        .markdown-view h${l} {
                            counter-reset: ${[...new Set(levels.slice(l).flat())].join(' ')} !important
                        }
                    `
                }
            }

            const command: Commands = {

                /**
                 * 新增定理类环境
                 * @args `\newtheorem{name}[counter]{text}[level][attrs]`
                 */
                '\\newtheorem': {
                    form: [1, '', 1, '0', '{}'],
                    run: (args, data) => {
                        let [name, identifier, text, level, attrs] = args.map(i => i.trim()) as any

                        if (identifier === '') {
                            identifier = undefined
                        }

                        level = parseInt(level)

                        try {
                            attrs = JSON.parse(attrs)
                        } catch {
                            printErrorMessage('\\newtheorem', 'JSON 解析失败', data.start)
                            attrs = {}
                        }

                        let envs: Environments = {}
                        envs[name] = {
                            text,
                            counter: {
                                identifier,
                                level
                            },
                            ...attrs
                        }

                        if (!normalizeEnvAttributes(envs)) {
                            printErrorMessage('\\newtheorem', '存在非法的环境属性', data.start)
                            return false
                        }

                        environment[name] = envs[name]

                        updateStyle(environment)

                        return true
                    }
                },

                /**
                 * 开始环境
                 * @args `\begin{name}[label]`
                 */
                '\\begin': {
                    form: [1, ''],
                    run: (args, data) => {
                        if (data.state.env.mathEnv !== undefined) {
                            return false
                        }

                        let [name, label] = args.map(i => i.trim())

                        const isUnnumbered = name.slice(-1) === '*'
                        let nameWoStar = name

                        if (isUnnumbered) {
                            nameWoStar = name.slice(0, -1)
                        }

                        if (environment[nameWoStar] === undefined) {
                            printErrorMessage('\\begin', `未知环境 '${nameWoStar}'`, data.start)
                            return false
                        }

                        data.state.env.mathEnv = name

                        if (label !== '') {
                            label = ` (${label})`
                        }

                        const attr: [string, string][] = [['math-env-title', nameWoStar]]
                        if (isUnnumbered) {
                            attr.push(['class', 'skip-number'])
                        }

                        pushToken(data.state, 'math-env-open', 'div', 1, [data.start, data.end], [['math-env', nameWoStar]])
                        pushToken(data.state, 'math-env-title-open', 'span', 1, null, attr)
                        pushToken(data.state, 'inline', '', 0).content = label
                        pushToken(data.state, 'math-env-title-close', 'span', -1)

                        return true
                    }
                },

                /**
                 * 结束环境
                 * @args `\end{name}`
                 */
                '\\end': {
                    form: 1,
                    run: (args, data) => {
                        const name = args[0].trim()

                        if (data.state.env.mathEnv !== name) {
                            printErrorMessage('\\end', `开始环境 '${data.state.env.mathEnv}' 与结束环境 '${name}' 不匹配`, data.start)
                            return false
                        }

                        delete data.state.env.mathEnv

                        pushToken(data.state, 'math-env-close', 'div', -1)

                        return true
                    }
                },

                /**
                 * 重设计数器
                 * @args `\setcounter{counter}{value}`
                 */
                '\\setcounter': {
                    form: 2,
                    run: (args, data) => {
                        let [identifier, number] = args.map(i => i.trim()) as any

                        if (!/[a-zA-Z-]+/.test(identifier)) {
                            printErrorMessage('\\setcounter', `计数器标识 '${identifier}' 不合法`, data.start)
                            return false
                        }

                        number = parseInt(number)

                        if (!Number.isInteger(number)) {
                            printErrorMessage('\\setcounter', `重设的数值 '${number}' 不合法`, data.start)
                            return false
                        }

                        pushToken(data.state, '', 'div', 1, [data.start, data.end], [['style', `counter-reset: ${identifier} ${number - 1}`]])
                        pushToken(data.state, '', 'div', -1)

                        return true
                    }
                }

            }

            // 更改样式时重新读取预设
            ctx.registerHook('SETTING_CHANGED', ({ changedKeys }) => {
                if (changedKeys.includes('custom-css')) {
                    readPreset()
                }
            })

            // 渲染前初始化相关变量
            ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
                environment = Object.assign({}, presetEnvironment)

                const fm = env.attributes
                if (fm !== undefined) {
                    debug = fm.mathEnvDebug ?? false
                    fm.wrapCode ??= true // 默认启用代码换行
                }
            })

            // 添加 MathEnv 语法
            ctx.markdown.registerPlugin(md => {
                md.block.ruler.before('paragraph', 'math-env', (state, start, end, silent) => {
                    const parser = new Parser(state.src, state.bMarks[start] + state.tShift[start])

                    // 匹配命令
                    if (parser.getChar() !== '\\') {
                        return false
                    }
                    const cmd = parser.matchCommand()
                    if (cmd === null) {
                        return false
                    }
                    if (command[cmd] === undefined) {
                        printErrorMessage('匹配命令', `未知命令 '${cmd}'`, start)
                        return false
                    }
                    parser.skipSpaces()

                    // 匹配参数
                    const args = parser.matchArguments(command[cmd].form)
                    if (args === null) {
                        printErrorMessage(cmd, '参数匹配失败', start)
                        return false
                    }
                    parser.skipSpaces()
                    if (!parser.isEOL()) {
                        printErrorMessage(cmd, '一行至多只能有一个命令', start)
                        return false
                    }

                    if (silent) {
                        return true
                    }

                    // 执行命令
                    end = start + 1 // 命令都被限制在了一行内所以这里可以直接+1，以后可能会取消这个限制……

                    if (!command[cmd].run(args, { state, start, end })) {
                        printErrorMessage(cmd, '命令执行失败', start)
                        return false
                    }

                    ++state.line

                    return true
                }, { alt: ['paragraph'] })
            })

            readPreset()
        }
    })
}