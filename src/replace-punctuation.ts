import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.replace-punctuation'
const settingRule = 'extension-math.replace-rule'
const actionReplace = 'extension-math.replace-punctuation'

const defaultRule = '，、。？！；：（）=>, |, |. |? |! |; |: | (|) '

const parse = (str: string) => {
    const pos = str.indexOf('=>')
    if (pos === -1) {
        return null
    }

    const source = str.slice(0, pos)
    const target = str.slice(pos + 2).split('|')
    if (source.length !== target.length) {
        return null
    }

    return {
        regex: new RegExp('[' + source + ']', 'g'),
        map: Object.fromEntries(source.split('').map((x, i) => [x, target[i]]))
    }
}

const pluginRegister = (ctx: Ctx) => {
    let rule = parse(ctx.setting.getSetting(settingRule, defaultRule))!

    // 设置面板
    ctx.setting.changeSchema(schema => {
        schema.properties[settingRule] = {
            title: '标点替换规则',
            group: 'editor',
            type: 'string',
            defaultValue: defaultRule,
            validator: (_, value, path) => {
                return parse(value) !== null ? [] : [{ property: settingRule, path, message: '格式错误' }]
            }
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

                content = content.replaceAll('\r\n', '\n')
                    .replace(rule.regex, match => rule.map[match])
                    .replace(/\s*$/, '\n')
                    .replace(/[^\S\n]+$/mg, '')

                editor.executeEdits('replace-punctuation', [{
                    range: editor.getModel()!.getFullModelRange(),
                    text: content,
                    forceMoveMarkers: true
                }])
            }
        })
    })

    // 更改设置后刷新
    ctx.registerHook('SETTING_CHANGED', ({ changedKeys, settings }) => {
        if (changedKeys.includes(settingRule as any)) {
            rule = parse(settings[settingRule])!
        }
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })