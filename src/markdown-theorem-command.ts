import { MatchPattern } from "./markdown-theorem-parser"
import State from "./markdown-theorem-state"

export type CommandData = {
    pattern: MatchPattern,
    execute: (args: string[], state: State) => boolean
}

const command: Record<string, CommandData> = {
    '\\newtheorem': {
        pattern: [1, '', 1, '0'],
        execute: (args, state) => {
            let [name, shared, text, level] = args.map(i => i.trim()) as any

            if (state.env.contains(name)) {
                state.error(`环境 ${name} 已存在`)
                return false
            }
            if (!/[a-zA-Z@]+/.test(name)) {
                state.error(`环境名 ${name} 必须满足正则表达式 [a-zA-Z@]+`)
                return false
            }
            const counter = shared !== '' ? shared : parseInt(level)
            if (!state.env.isValidCounter(counter)) {
                state.error(typeof counter === 'string' ? `要共享计数器的环境 ${counter} 必须存在` : `编号层级 ${counter} 必须为 0-6 的整数`)
                return false
            }

            state.env.data[name] = { text, counter }

            return true
        }
    },

    '\\begin': {
        pattern: [1, ''],
        execute: (args, state) => {
            let [name, info] = args.map(i => i.trim()) as any

            const skipped = name.slice(-1) === '*'
            const name0 = skipped ? name.slice(0, -1) : name
            if (!state.env.contains(name0)) {
                state.error(`未知环境 '${name0}'`)
                return false
            }

            state.stack.push(name)

            let classList = 'theorem'
            if (skipped) {
                classList += ' skip-number'
            }
            state.push('theorem_open', 'div', 1, { map: state.range, attrs: [['class', classList], ['env-name', name0]] })
            state.push('theorem_info', 'div', 0, { content: info })

            return true
        }
    },

    '\\end': {
        pattern: 1,
        execute: (args, state) => {
            let name = args[0].trim() as any

            const last = state.stack.pop()
            if (last !== name) {
                state.error(`开始环境 '${last}' 与结束环境 '${name}' 不一致`)
                return false
            }

            state.push('theorem_close', 'div', -1)

            return true
        }
    },

    '\\setcounter': {
        pattern: 2,
        execute: (args, state) => {
            let [name, number] = args.map(i => i.trim()) as any

            if (!state.env.contains(name)) {
                state.error(`未知环境 '${name}'`)
                return false
            }
            number = parseInt(number)
            if (!Number.isInteger(number)) {
                state.error(`要设置的数值 '${number}' 必须是整数`)
                return false
            }

            state.push('set_counter', 'div', 0, { attrs: [['style', `counter-reset: ${state.env.getCounterInfo(name)!.id} ${number - 1}`]] })

            return true
        }
    },

    '\\settheorem': {
        pattern: 2,
        execute: (args, state) => {
            let [name, data] = args.map(i => i.trim()) as any

            if (!state.env.contains(name)) {
                state.error(`未知环境 '${name}'`)
                return false
            }
            try {
                data = JSON.parse('{' + data + '}')
            } catch {
                state.error(`要设置的属性 {${data}} 必须是合法的 JSON 表达式`)
                return false
            }
            if (data.counter !== undefined) {
                if (!state.env.isValidCounter(data.counter)) {
                    state.error(`要设置的计数器 ${data.counter} 不合法`)
                    return false
                }
            }

            Object.assign(state.env.get(name), data)

            return true
        }
    }
}

export default class Command {
    /**
     * 获取指定命令的模式
     * @param cmd 命令名
     * @returns 模式，若命令不存在则返回 `null`
     */
    static getPattern(cmd: string) {
        return command[cmd]?.pattern ?? null
    }

    /**
     * 执行一个命令
     * @param cmd 命令名
     * @param args 命令参数
     * @param state 状态
     * @returns 是否执行成功，若命令不存在则返回 `false`
     */
    static execute(cmd: string, args: string[], state: State) {
        return command[cmd]?.execute(args, state) ?? false
    }
}