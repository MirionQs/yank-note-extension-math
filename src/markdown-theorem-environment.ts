export type EnvironmentData = {
    text: string,
    counter: number | string,
    [_: string]: any
}

const defaultStyle = `
.theorem {
    margin: 1em 0;
}

.theorem-info + p {
    display: inline;
}

.theorem-info:not(.empty)::before {
    content: "(";
}

.theorem-info:not(.empty)::after {
    content: ") ";
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
    const counterContent = ['" " ']
    const counterReset = ['']
    for (let i = 2; i <= 6; ++i) {
        counterContent.push(counterContent[i - 2] + `counter(h${i}counter) "." `)
        counterReset.unshift(counterReset[0] + `h${8 - i}counter `)
    }

    let css = defaultStyle
    for (const name in env.data) {
        const data = env.get(name)
        const { id, level, shared } = env.getCounter(name)

        if (!shared) {
            counterReset[level - 1] += name + ' '
        }

        css += `
.theorem[env-name="${name}"]::before {
    content: "${data.text}" ${level === 0 ? '' : `${counterContent[level - 1]} counter(${id})`} ". ";
    font-weight: bold;
    counter-increment: ${id};
}
`
    }

    for (let i = 2; i <= 6; ++i) {
        css += `
.markdown-view .markdown-body h${i} {
    counter-reset: ${counterReset[i - 1]} !important;
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
        this.data = defaultData
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
     * 获取指定环境的计数器信息
     * @param name 环境名
     * @returns 计数器信息
     */
    getCounter(name: string) {
        const counter = this.get(name).counter
        return typeof counter === 'number' ? {
            id: name.replaceAll('@', '-'),
            level: counter,
            shared: false
        } : {
            id: counter.replaceAll('@', '-'),
            level: this.get(counter).counter as number,
            shared: true
        }
    }
}