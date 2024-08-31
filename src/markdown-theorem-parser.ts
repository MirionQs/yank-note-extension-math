import StateBlock from "@yank-note/runtime-api/types/types/third-party/markdown-it/lib/rules_block/state_block"

export type MatchPattern = number | string | (number | string)[]

export default class Parser {
    mdState: StateBlock
    line: number
    pos: number

    /**
     * 构造一个 Parser
     * @param state Markdown 状态
     * @param startLine 初始行数
     */
    constructor(state: StateBlock, startLine: number) {
        this.mdState = state
        this.line = startLine
        this.pos = state.bMarks[startLine]
    }

    /**
     * 获取当前字符
     * @returns 当前字符
     */
    get() {
        return this.mdState.src[this.pos]
    }

    /**
     * 获取当前行尾的位置
     * @returns 当前行尾的位置
     */
    getEOL() {
        return this.mdState.eMarks[this.line]
    }

    /**
     * 获取当前行
     * @returns 当前行
     */
    getLine() {
        return this.mdState.src.slice(this.pos, this.getEOL())
    }

    /**
     * 跳过空白字符
     */
    skipSpaces() {
        this.pos = this.mdState.skipSpaces(this.pos)
    }

    /**
     * 返回是否已达行尾
     * @returns 是否已达行尾
     */
    isEOL() {
        return this.pos === this.getEOL()
    }

    /**
     * 查找字符串首次出现的位置
     * @param str 指定字符串
     * @returns 首次出现的位置，找不到返回 `-1`
     */
    find(str: string, start: number = this.pos) {
        return this.mdState.src.indexOf(str, start)
    }

    /**
     * 行内查找字符首次出现的位置，忽略转义和行内公式
     * @param char 指定字符
     * @returns 首次出现的位置，找不到返回 `-1`
     */
    findChar(char: string) {
        const begin = this.pos
        const end = this.getEOL()
        for (let i = begin; i !== end; ++i) {
            let c = this.mdState.src[i]
            if (c === '\\') {
                ++i
            }
            else if (c === '$') {
                for (let j = i + 1; j !== end; ++j) {
                    c = this.mdState.src[j]
                    if (c === '\\') {
                        ++j
                    }
                    else if (c == '$') {
                        i = j
                        break
                    }
                }
            }
            else if (c === char) {
                return i
            }
        }
        return -1
    }

    /**
     * 匹配一个命令
     * @returns 匹配到的命令，失败返回 `null`
     */
    matchCommand() {
        const match = this.getLine().match(/^\\[a-zA-Z@]+\*?/)
        if (match === null) {
            return null
        }
        const cmd = match[0]
        this.pos += cmd.length
        return cmd
    }

    /**
     * 匹配一个命令参数
     * @returns 匹配到的命令参数，失败返回 `null`
     */
    matchArgument() {
        const eol = this.getEOL()
        if (this.get() === '{') {
            ++this.pos
            if (this.get() === '{') {
                const delimiter = this.mdState.src.slice(this.pos + 1, eol).trim() + '}}'
                const right = this.find(delimiter, eol)
                if (right === -1) {
                    return null
                }
                const arg = this.mdState.src.slice(eol, right)
                this.pos = right + delimiter.length
                this.line += arg.match(/\n/g)?.length ?? 0
                return arg
            }
            else {
                const right = this.findChar('}')
                if (right === -1) {
                    return null
                }
                const arg = this.mdState.src.slice(this.pos + 1, right)
                this.pos = right + 1
                return arg
            }
        }
        else {
            if (this.pos === eol) {
                return null
            }
            const arg = this.get()
            ++this.pos
            return arg
        }
    }

    /**
     * 匹配一个可选命令参数
     * @param defaultValue 缺省值
     * @returns 匹配到的可选命令参数，失败返回 `null`
     */
    matchOptionalArgument(defaultValue: string) {
        const eol = this.getEOL()
        if (this.get() === '[') {
            ++this.pos
            if (this.get() === '[') {
                const delimiter = this.mdState.src.slice(this.pos + 1, eol).trim() + ']]'
                const right = this.find(delimiter, eol)
                if (right === -1) {
                    return null
                }
                const arg = this.mdState.src.slice(eol, right)
                this.pos = right + delimiter.length
                this.line += arg.match(/\n/g)?.length ?? 0
                return arg
            }
            else {
                const right = this.findChar(']')
                if (right === -1) {
                    return null
                }
                const arg = this.mdState.src.slice(this.pos + 1, right)
                this.pos = right + 1
                return arg
            }
        }
        else {
            return defaultValue
        }
    }

    /**
     * 按模式匹配参数并跳过末尾空白字符
     * @param pattern 参数模式，例如 `[3, 'opt']` 代表连续匹配三个普通参数和一个缺省值为 `'opt'` 的可选参数
     * @returns 匹配到的参数，失败返回 `null`
     */
    matchPattern(pattern: MatchPattern) {
        const args: string[] = []
        if (typeof pattern === 'number') {
            while (pattern > 0) {
                const arg = this.matchArgument()
                if (arg === null) {
                    return null
                }
                args.push(arg)
                this.skipSpaces()
                --pattern
            }
        }
        else if (typeof pattern === 'string') {
            const arg = this.matchOptionalArgument(pattern)
            if (arg === null) {
                return null
            }
            args.push(arg)
            this.skipSpaces()
        }
        else {
            for (const i of pattern) {
                const arg = this.matchPattern(i)
                if (arg === null) {
                    return null
                }
                args.push(...arg)
            }
        }
        return args
    }
}