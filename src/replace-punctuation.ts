import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.replace-punctuation'
const settingRule = 'extension-math.replace-rules'
const actionReplace = 'extension-math.replace-punctuation'

type Rule = {
    match: string,
    replace: string
}

const defaultRules: Rule[] = [
    { match: '，', replace: ', ' },
    { match: '、', replace: ', ' },
    { match: '。', replace: '. ' },
    { match: '？', replace: '? ' },
    { match: '！', replace: '! ' },
    { match: '；', replace: '; ' },
    { match: '：', replace: ': ' },
    { match: '（', replace: ' (' },
    { match: '）', replace: ') ' },
]

const pluginRegister = (ctx: Ctx) => {
    // 设置面板
    ctx.setting.changeSchema(schema => {
        schema.groups.push({ label: '标点替换' as any, value: 'punctuation' as any })
        schema.properties[settingRule] = {
            title: '标点替换规则',
            group: 'punctuation',
            type: 'array',
            format: 'table',
            defaultValue: defaultRules,
            items: {
                type: 'object',
                title: '规则',
                properties: {
                    match: {
                        type: 'string',
                        title: '匹配',
                        defaultValue: '',
                        maxLength: 10,
                    },
                    replace: {
                        type: 'string',
                        title: '替换为',
                        defaultValue: '',
                        maxLength: 10,
                    },
                }
            },
        }
    })

    // 命令面板
    ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
        editor.addAction({
            id: actionReplace,
            label: 'math: 替换标点符号',
            keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
            run: editor => {
                let content = editor.getValue()
                const rules = ctx.setting.getSetting(settingRule, defaultRules)
                const regex = new RegExp(rules.map(x => ctx.lib.lodash.escapeRegExp(x.match)).join('|'), 'g')
                const map = ctx.lib.lodash.keyBy(rules, 'match') as Record<string, Rule>

                content = content.replaceAll('\r\n', '\n')
                    .replace(regex, match => map[match].replace)
                    .replace(/\s*$/, '\n')
                    .replace(/[^\S\n]+$/mg, '')

                editor.executeEdits('replace-punctuation', [{
                    range: editor.getModel()!.getFullModelRange(),
                    text: content
                }])
            }
        })
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })
