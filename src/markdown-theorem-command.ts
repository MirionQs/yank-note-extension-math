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
            if (shared !== '' && state.env.contains(shared)) {
                state.error(`要共享计数器的环境 ${shared} 必须存在`)
                return false
            }
            level = parseInt(level)
            if (!Number.isInteger(level) || level < 0 || level > 6) {
                state.error(`编号层级 ${level} 必须为 0-6 的整数`)
                return false
            }

            let counter = shared
            if (shared === '') {
                counter = level
            }
            else {
                const sharedCounter = state.env.get(shared).counter
                if (typeof sharedCounter === 'string') {
                    counter = sharedCounter
                }
            }

            state.env.data[name] = { text, counter }
            state.apply()

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

            let classDiv = 'theorem'
            if (skipped) {
                classDiv += ' skip-number'
            }

            let classInfo = 'theorem-info'
            if (info === '') {
                classInfo += ' empty'
            }

            state.push('theorem-open', 'div', 1, state.range, [['class', classDiv], ['env-name', name0]])
            state.push('theorem-info-before-open', 'span', 1, null, [['class', 'theorem-info-before']])
            state.push('theorem-info-before-close', 'span', -1)
            state.push('theorem-info-open', 'span', 1, null, [['class', classInfo]])
            state.push('inline', '', 0).content = info
            state.push('theorem-info-close', 'span', -1)
            state.push('theorem-info-after-open', 'span', 1, null, [['class', 'theorem-info-after']])
            state.push('theorem-info-after-close', 'span', -1)

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

            state.push('theorem-close', 'div', -1)

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

            state.push('', 'div', 1, state.range, [['style', `counter-reset: ${name.replaceAll('@', '-')} ${number - 1}`]])
            state.push('', 'div', -1)

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
                state.error(`要设置的属性 '${data}' 必须是合法的 JSON 表达式`)
                return false
            }
            if (data.text !== undefined || data.counter !== undefined) {
                state.error(`要设置的属性 '${data}' 不能含有 text 或 counter 项`)
                return false
            }

            Object.assign(state.env.get(name), data)
            state.apply()

            return true
        }
    }
}

export default class Command {
    /**
     * 获取指定命令的模式
     * @param cmd 命令名
     * @returns 若存在则返回指定命令的模式，反之返回 `null`
     */
    static getPattern(cmd: string) {
        return command[cmd]?.pattern ?? null
    }

    /**
     * 执行一个命令
     * @param cmd 命令名
     * @param args 命令参数
     * @param state 状态
     * @returns 命令执行结果，若命令不存在则返回 `false`
     */
    static execute(cmd: string, args: string[], state: State) {
        return command[cmd]?.execute(args, state) ?? false
    }
}