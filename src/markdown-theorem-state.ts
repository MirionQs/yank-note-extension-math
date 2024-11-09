import Token from "@yank-note/runtime-api/types/types/third-party/markdown-it/lib/token"
import Parser from "./markdown-theorem-parser"
import Environment from "./markdown-theorem-environment"

export default class State {
    style: HTMLStyleElement
    env: Environment
    parser: Parser
    stack: Token[]
    range: [number, number]

    /**
     * 构造一个 State
     * @param style 样式元素
     */
    constructor(style: HTMLStyleElement) {
        this.style = style
        this.env = new Environment
        this.parser = new Parser
        this.stack = []
        this.range = [0, 0]
    }

    /**
     * 应用当前环境
     */
    apply() {
        this.style.innerHTML = this.env.generate()
    }

    /**
     * 推入一个标记
     * @param type 标记类型
     * @param tag HTML 标签
     * @param nesting 标签开闭
     * @param props 其它属性
     * @returns 推入的标记
     */
    push(type: string, tag: string, nesting: Token.Nesting, props: any = {}) {
        return Object.assign(this.parser.mdState.push(type, tag, nesting), props) as Token
    }

    /**
     * 返回标记列表
     * @returns 标记列表
     */
    tokens() {
        return this.parser.mdState.tokens
    }

    /**
     * 打印错误信息
     * @param content 内容
     */
    error(content: string) {
        console.error(`${this.parser.command}: ${content}, 位于行 ${this.parser.line + 1}`)
    }
}