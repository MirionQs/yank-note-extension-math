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
            let [env, shared, text, level] = args.map(i => i.trim()) as any

            const counter = shared !== '' ? shared : parseInt(level)
            if (!state.environment.add(env, { text, counter })) {
                state.error('\\newtheorem', '添加环境失败')
                return false
            }

            state.environment.apply()

            return true
        }
    },

    '\\begin': {
        pattern: [1, ''],
        execute: (args, state) => {
            let [env, info] = args.map(i => i.trim()) as any

            const skipped = env.slice(-1) === '*'
            const env0 = skipped ? env : env.slice(0, -1)

            if (state.environment[env0] === undefined) {
                state.error('\\begin', `未知环境 '${env0}'`)
                return false
            }

            state.stack.push(env)
            if (info !== '') {
                info = ` (${info})`
            }

            state.push('theorem-open', 'div', 1, state.range, [['theorem-env', env0], ['theorem-data', JSON.stringify(state.environment[env0])]])
            state.push('theorem-info-open', 'span', 1, null, skipped ? [['class', 'skip-number']] : [])
            state.push('inline', '', 0).content = info
            state.push('theorem-info-close', 'span', -1)

            return true
        }
    },

    '\\end': {
        pattern: 1,
        execute: (args, state) => {
            let env = args[0].trim() as any

            const last = state.stack.pop()
            if (last !== env) {
                state.error('\\end', `开始环境 '${last}' 与结束环境 '${env}' 不匹配`)
                return false
            }

            state.push('theorem-close', 'div', -1)

            return true
        }
    },

    '\\setcounter': {
        pattern: 2,
        execute: (args, state) => {
            let [env, number] = args.map(i => i.trim()) as any

            if (state.environment[env] === undefined) {
                state.error('\\setcounter', `未知环境 '${env}'`)
                return false
            }

            number = parseInt(number)
            if (!Number.isInteger(number)) {
                state.error('\\setcounter', `要设置的数值 '${number}' 必须是整数`)
                return false
            }

            state.push('', 'div', 1, state.range, [['style', `counter-reset: ${env.replaceAll('@', '-')} ${number - 1}`]])
            state.push('', 'div', -1)

            return true
        }
    },

    '\\settheorem': {
        pattern: 2,
        execute: (args, state) => {
            let [env, data] = args.map(i => i.trim()) as any

            if (state.environment[env] === undefined) {
                state.error('\\settheorem', `未知环境 '${env}'`)
                return false
            }

            try {
                data = JSON.parse('{' + data + '}')
            } catch {
                state.error('\\settheorem', `要设置的属性 '${data}' 必须是合法的 JSON 表达式`)
                return false
            }
            if (data.text !== undefined || data.counter !== undefined) {
                state.error('\\settheorem', `要设置的属性 '${data}' 不能含有 text 和 counter 项`)
                return false
            }

            Object.assign(state.environment[env], data)

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