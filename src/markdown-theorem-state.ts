import StateBlock from "@yank-note/runtime-api/types/types/third-party/markdown-it/lib/rules_block/state_block"
import Parser from "./markdown-theorem-parser"
import Environment from "./markdown-theorem-environment"

export default class State {
    style: HTMLStyleElement
    env: Environment
    mdState: StateBlock
    parser: Parser
    stack: string[]
    range: [number, number]

    /**
     * 构造一个 State
     * @param style 样式元素
     */
    constructor(style: HTMLStyleElement) {
        this.style = style
        this.env = new Environment
        this.stack = []
    }

    /**
     * 绑定 Markdown 状态和初始行数
     * @param mdState Markdown 状态
     * @param startLine 初始行数
     */
    bind(mdState: StateBlock, startLine: number) {
        this.mdState = mdState
        this.parser = new Parser(mdState, startLine)
    }

    /**
     * 应用当前环境
     */
    apply() {
        this.style.innerHTML = this.env.generator(this.env)
    }

    /**
     * 推入一个标记
     * @param type 标记类型
     * @param tag HTML 标签
     * @param nesting 标签开闭
     * @param map 源码范围
     * @param attrs HTML 属性
     * @param content HTML 内容
     * @returns 推入的标记
     */
    push(type: string, tag: string, nesting: -1 | 0 | 1, map: [number, number] | null = null, attrs: [string, string][] | null = null) {
        const token = Object.assign(this.mdState.push(type, tag, nesting), { map, attrs })
        if (type === 'inline') {
            token.children = []
        }
        return token
    }

    /**
     * 打印错误信息
     * @param content 内容
     */
    error(content: string) {
        console.error(`${this.parser.command}: ${content}, 位于行 ${this.parser.line + 1}`)
    }
}