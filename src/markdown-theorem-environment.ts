import { ctx } from "@yank-note/runtime-api"

export type EnvironmentData = {
    text: string,
    counter: number | string,
    [_: string]: any
}

const defaultStyle = `
.theorem {
    margin: 1em 0;
}

.theorem-info {
    display: inline-block;
    margin-right: .5em;
}

.theorem-info + p {
    display: inline;
}

.theorem-info::before,
.theorem-info::after,
.theorem.skip-number > .theorem-info {
    font-weight: bold;
}

.theorem:not(.skip-number) > .theorem-info:not(.empty) > .content::before {
    content: " (";
}

.theorem:not(.skip-number) > .theorem-info:not(.empty) > .content::after {
    content: ")";
}

.theorem-info::after {
    content: ".";
}
`

const defaultData = {
    axiom: {
        text: '公理',
        counter: 1
    },
    definition: {
        text: '定义',
        counter: 2
    },
    theorem: {
        text: '定理',
        counter: 3
    },
    proposition: {
        text: '命题',
        counter: 'theorem'
    },
    lemma: {
        text: '引理',
        counter: 'theorem'
    },
    corollary: {
        text: '推论',
        counter: 'theorem'
    },
    property: {
        text: '性质',
        counter: 'theorem'
    },
    problem: {
        text: '问题',
        counter: 3
    },
    example: {
        text: '例',
        counter: 3
    },
    exercise: {
        text: '练习',
        counter: 3
    },
    note: {
        text: '笔记',
        counter: 0
    },
    conclusion: {
        text: '结论',
        counter: 0
    },
    assumption: {
        text: '假设',
        counter: 0
    },
    remark: {
        text: '注',
        counter: 0
    },
    solution: {
        text: '解',
        counter: 0
    },
    proof: {
        text: '证明',
        counter: 0
    }
}

const defaultGenerator = (env: Environment) => {
    const counterContent = Array(7).fill('')
    const counterReset = Array(7).fill('')
    for (let i = 2; i <= 6; ++i) {
        counterContent[i] = counterContent[i - 1] + `counter(h${i}counter) "." `
        counterReset[i - 1] = `h${i}counter `
    }

    let css = ''
    for (const name in env.data) {
        const data = env.get(name)
        const { id, level, shared } = env.getCounterInfo(name)!

        if (level === 0) {
            css += `
.theorem[env-name="${name}"] > .theorem-info::before {
    content: "${data.text}";
}
`
            continue
        }

        if (!shared) {
            counterReset[level] += id + ' '
        }

        css += `
.theorem.skip-number[env-name="${name}"] > .theorem-info.empty::before {
    content: "${data.text}";
}

.theorem:not(.skip-number)[env-name="${name}"] > .theorem-info::before {
    content: "${data.text} " ${counterContent[level]} counter(${id});
    counter-increment: ${id};
}
`
    }

    for (let i = 5; i >= 1; --i) {
        counterReset[i] += counterReset[i + 1]
    }
    for (let i = 1; i <= 6; ++i) {
        css += `
.markdown-body ${i === 1 ? '' : 'h' + i} {
    counter-reset: ${counterReset[i]} !important;
}
`
    }

    return css
}

export default class Environment {
    data: Record<string, EnvironmentData>
    generator: (env: Environment) => string

    /**
     * 构造一个 Environment
     */
    constructor() {
        this.data = ctx.lib.lodash.cloneDeep(defaultData)
        this.generator = defaultGenerator
    }

    /**
     * 获取指定环境
     * @param name 环境名
     * @returns 环境，若不存在则返回 `undefined`
     */
    get(name: string) {
        return this.data[name]
    }

    /**
     * 查询是否存在指定环境
     * @param name 环境名
     * @returns 存在返回 `true` ，不存在则返回 `false`
     */
    contains(name: string) {
        return this.get(name) !== undefined
    }

    /**
     * 检查计数器是否有效
     * @param counter 计数器
     * @returns 是否有效
     */
    isValidCounter(counter: any) {
        if (typeof counter === 'string') {
            return this.contains(counter)
        }
        if (typeof counter === 'number') {
            return Number.isInteger(counter) && 0 <= counter && counter <= 6
        }
        return false
    }

    /**
     * 获取指定环境的计数器信息
     * @param name 环境名
     * @returns 计数器信息，若不存在则返回 `null`
     */
    getCounterInfo(name: string) {
        let shared = false
        while (true) {
            const counter = this.get(name)?.counter
            if (typeof counter === 'string') {
                shared = true
                name = counter
                continue
            }
            if (typeof counter === 'number') {
                return {
                    id: name.replaceAll('@', '-'),
                    level: counter,
                    shared
                }
            }
            return null
        }
    }

    /**
     * 生成 CSS
     * @returns 生成的CSS
     */
    generate() {
        const gen = this.generator
        this.generator = defaultGenerator
        const css = gen(this)
        this.generator = gen
        return defaultStyle + css
    }
}