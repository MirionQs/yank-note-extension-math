import { registerPlugin } from "@yank-note/runtime-api"

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const name = 'extension-math.markdown.math-env'

type Form = number | string | (number | string)[]

type Command = {
    form: Form,
    run: (args: string[], data: any) => boolean
}

type Environment = {
    text: string,
    counter: {
        identifier?: string,
        level?: number
    },
    [attr: string]: any
}

type Commands = Record<string, Command>

type Environments = Record<string, Environment>

class Parser {
    src: string
    pos: number

    constructor(src: string, startFrom: number = 0) {
        this.src = src
        this.pos = startFrom
    }

    /**
     * 判断当前位置是否有效
     * @returns 有效则返回 `true` ，无效则返回 `false`
     */
    isValid() {
        return this.pos >= 0 && this.pos < this.src.length
    }

    /**
     * 返回当前位置的字符
     * @returns 当前位置的字符
     */
    getChar() {
        return this.src[this.pos]
    }

    /**
     * 判断当前位置是否为行尾
     * @returns 当前位置为行尾/无效返回 `true` ，反之返回 `false`
     */
    isEOL() {
        return !this.isValid() || this.getChar() === '\n'
    }

    /**
     * 返回当前位置的行号
     * @returns 当前位置的行号，如果当前位置无效则返回总行数
     */
    getLineNumber() {
        if (!this.isValid()) {
            return (this.src.match(/\n/g) ?? []).length
        }
        return (this.src.slice(0, this.pos + 1).match(/\n/g) ?? []).length - 1
    }

    /**
     * 跳过空白，包括空格和制表符
     */
    skipSpaces() {
        while (this.getChar() === ' ' || this.getChar() === '\t') {
            ++this.pos
        }
    }

    /**
     * 查找字符首次出现的位置并避开转义、行内代码、行内公式
     * @param char 要查找的字符
     * @returns 查找字符首次出现的位置，找不到则返回 `-1`
     */
    find(char) {
        let str = this.src.slice(this.pos)
        str = str.slice(0, str.search(/\n|$/)).replace(/\\[!"#$%&'()*+,-./:;<=>?@\[\\\]^_`{|}~]/g, '  ') // 去除转义字符
        let env = ''
        let offset = 0
        for (const c of str) {
            if (c === '$' || c === '`') {
                if (env === '') {
                    env = c
                }
                else if (env === c) {
                    env = ''
                }
            }
            if (char === c && env === '') {
                return this.pos + offset
            }
            ++offset
        }
        return -1
    }

    /**
     * 匹配一个命令
     * @returns 匹配到的命令，失败则返回 `null`
     */
    matchCommand() {
        const cmd = this.src.slice(this.pos).match(/^\\[a-zA-Z@]+\*?/)
        if (cmd === null) {
            return null
        }
        this.pos += cmd[0].length
        return cmd[0]
    }

    /**
     * 匹配一个命令参数
     * @returns 匹配到的命令参数，失败则返回 `null`
     */
    matchArgument() {
        if (this.isEOL()) {
            return null
        }
        let arg = ''
        if (this.getChar() === '{') {
            const right = this.find('}')
            if (right === -1) {
                return null
            }
            arg = this.src.slice(this.pos + 1, right)
            this.pos += arg.length + 2
        }
        else {
            arg = this.getChar()
            ++this.pos
        }
        return arg
    }

    /**
     * 匹配一个可选命令参数
     * @param defaultValue 缺省值
     * @returns 匹配到的可选命令参数，失败则返回 `null`
     */
    matchOptionalArgument(defaultValue: string) {
        let optArg = defaultValue
        if (!this.isEOL() && this.getChar() === '[') {
            const right = this.find(']')
            if (right === -1) {
                return null
            }
            optArg = this.src.slice(this.pos + 1, right)
            this.pos += optArg.length + 2
        }
        return optArg
    }


    /**
     * 匹配多个参数
     * @param form 参数形式，例如 `[3, 'off']` 代表连续匹配三个普通参数以及一个缺省值为 `'off'` 的可选参数
     * @returns 匹配到的多个参数，失败则返回 `null`
     */
    matchArguments(form: Form) {
        const args: string[] = []
        if (typeof form === 'number') {
            while (form > 0) {
                const arg = this.matchArgument()
                if (arg === null) {
                    return null
                }
                args.push(arg)
                this.skipSpaces()
                --form
            }
        }
        else if (typeof form === 'string') {
            const optArg = this.matchOptionalArgument(form)
            if (optArg === null) {
                return null
            }
            args.push(optArg)
        }
        else {
            for (const f of form) {
                const argList = this.matchArguments(f)
                if (argList === null) {
                    return null
                }
                args.push(...argList)
                this.skipSpaces()
            }
        }
        return args
    }
}

export default () => {
    registerPlugin({
        name,
        register: async ctx => {
            const style = await ctx.theme.addStyles('')
            let presetEnvironment: Environments
            let environment: Environments
            let template: string

            /**
             * 打印错误信息
             * @param title 标题
             * @param content 内容
             * @param location 位置，为数字时则代表行数，打印时会自动+1，为字符串时则代表所在项，会直接输出
             */
            const printErrorMessage = (title: string, content: string, location?: number | string) => {
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

                    const identifier = envs[name].counter.identifier ?? name
                    const level = envs[name].counter.level ?? envs[identifier]?.counter?.level ?? 0

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
             * 推入一个 token
             * @returns 推入的 token
             */
            const pushToken = (
                state: any,
                type: string,
                tag: string,
                nesting: -1 | 0 | 1,
                map: [number, number] | null = null,
                attrs: [string, string][] | null = null,
                children: any[] = []
            ) => {
                const token = state.push(type, tag, nesting)
                token.map = map
                token.attrs = attrs
                token.children = children
                return token
            }

            /**
             * 读取预设
             */
            const readPreset = async () => {
                // 读取样式文件
                const constant = await ctx.api.rpc('return require("./constant")')

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

                updateCSS(presetEnvironment)

                console.log({ presetEnvironment, template }) // debug
            }

            /**
             * 更新 CSS
             * @param envs 要应用的环境
             */
            const updateCSS = (envs: Environments) => {
                style
                envs
                // TODO
            }

            const command: Commands = {
                /**
                 * 新增定理类环境
                 * @args `\newtheorem{name}[counter]{text}[level][attrs]`
                 */
                '\\newtheorem': {
                    form: [1, '', 1, '', '{}'],
                    run: (args, data) => {
                        let [name, identifier, label, level, attrs] = args.map(i => i.trim()) as any

                        if (identifier === '') {
                            identifier = undefined
                        }

                        if (level === '') {
                            level = undefined
                        }
                        else {
                            level = parseInt(level)
                        }

                        try {
                            attrs = JSON.parse(attrs)
                        } catch {
                            printErrorMessage('\\newtheorem', 'JSON 解析失败', data.start)
                            attrs = {}
                        }

                        let envs: Environments = {}
                        envs[name] = {
                            label,
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

                        updateCSS(environment)

                        console.log({ environment }) // debug

                        return true
                    }
                },
                /**
                 * 环境开始
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
                            printErrorMessage('\\begin', `未知环境 "${nameWoStar}"`, data.start)
                            return false
                        }

                        data.state.env.mathEnv = name

                        if (label !== '') {
                            label = ` (${label})`
                        }

                        pushToken(data.state, 'math-env-outer-div-open', 'div', 1,
                            [data.start, data.end], [['math-env-type', nameWoStar]])
                        pushToken(data.state, 'math-env-title-open', 'span', 1,
                            [data.start, data.end], isUnnumbered ? [['class', 'unnumbered']] : [])
                        pushToken(data.state, 'inline', '', 0,
                            [data.start, data.end], null, data.state.md.parseInline(label, data.state.env))
                        pushToken(data.state, 'math-env-title-close', 'span', -1)

                        return true
                    }
                },
                /**
                 * 环境结束
                 * @args `\end{name}`
                 */
                '\\end': {
                    form: 1,
                    run: (args, data) => {
                        const name = args[0].trim()

                        if (data.state.env.mathEnv !== name) {
                            printErrorMessage('\\end', `开始环境 "${data.state.env.mathEnv}" 与结束环境 "${name}" 不匹配`, data.start)
                            return false
                        }

                        delete data.state.env.mathEnv

                        pushToken(data.state, 'math-env-outer-div-close', 'div', -1)

                        return true
                    }
                }
            }

            ctx.registerHook('SETTING_CHANGED', ({ changedKeys }) => {
                if (changedKeys.includes('custom-css')) {
                    readPreset()
                }
            })

            ctx.registerHook('MARKDOWN_BEFORE_RENDER', () => {
                environment = JSON.parse(JSON.stringify(presetEnvironment))
            })

            ctx.markdown.registerPlugin(md => {
                md.block.ruler.before('paragraph', 'math-env', (state, start) => {
                    const parser = new Parser(state.src, state.bMarks[start] + state.tShift[start])

                    // 匹配命令
                    if (parser.getChar() !== '\\') {
                        return false
                    }
                    const cmd = parser.matchCommand()
                    if (cmd === null) {
                        printErrorMessage('匹配命令', '命令匹配失败', start)
                        return false
                    }
                    if (command[cmd] === undefined) {
                        printErrorMessage('匹配命令', `未知命令 "${cmd}"`, start)
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

                    // 执行命令
                    const end = parser.getLineNumber() + 1

                    console.log({ args, state, start, end }) // debug

                    if (!command[cmd].run(args, { state, start, end })) {
                        printErrorMessage(cmd, '命令执行失败', start)
                        return false
                    }

                    ++state.line

                    return true
                })

            })

            readPreset()
        }
    })
}