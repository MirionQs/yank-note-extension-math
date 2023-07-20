export default class {
    src: string
    pos: number

    constructor(src: string, startFrom: number = 0) {
        this.src = src
        this.pos = startFrom
    }

    /**
     * 判断当前位置是否有效
     * @returns 有效返回 `true` ，无效返回 `false`
     */
    isValid() {
        return this.pos >= 0 && this.pos < this.src.length
    }

    /**
     * 返回当前字符
     * @returns 当前字符，位置无效则返回 `undefined`
     */
    getChar() {
        return this.src[this.pos]
    }

    /**
     * 判断当前位置是否为行尾
     * @returns 当前位置为行尾或无效则返回 `true` ，反之返回 `false`
     */
    isEOL() {
        return !this.isValid() || this.getChar() === '\n'
    }

    /**
     * 跳过空白，仅包括空格和制表符
     */
    skipSpaces() {
        while (this.getChar() === ' ' || this.getChar() === '\t') {
            ++this.pos
        }
    }

    /**
     * 查找字符首次出现的位置并避开转义、行内代码、行内公式
     * @param char 要查找的字符
     * @returns 首次出现的位置，找不到则返回 `-1`
     */
    find(char: string) {
        let str = this.src.slice(this.pos)
        str = str.slice(0, str.search(/\n|$/)).replace(/\\[!'#$%&'()*+,-./:;<=>?@\[\\\]^_`{|}~]/g, '  ') // 去除转义字符
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
            if (c === char && env === '') {
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
     * @param form 参数形式，例如 `[3, 'off']` 代表连续匹配三个普通参数和一个缺省值为 `'off'` 的可选参数
     * @returns 匹配到的多个参数，失败则返回 `null`
     */
    matchArguments(form: number | string | (number | string)[]) {
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