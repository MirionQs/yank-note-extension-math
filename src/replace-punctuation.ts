import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.replace-punctuation'
const settingList = 'extension-math.replace-list'
const actionReplace = 'extension-math.replace-punctuation'

const defaultList = '，->, |、->, |。->. |？->? |！->! |；->; |：->: |（-> (|）->) '

const parse = (str: string) => {
    return str.split('|').map(i => i.split('->')).filter(i => i.length === 2) as [string, string][]
}

const pluginRegister = (ctx: Ctx) => {
    let replaceList: [string, string][] = parse(ctx.setting.getSetting(settingList, defaultList))

    // 设置面板
    ctx.setting.changeSchema(schema => {
        schema.properties[settingList] = {
            title: '中文标点替换列表',
            group: 'editor',
            type: 'string',
            defaultValue: defaultList
        }
    })

    // 命令面板
    ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
        editor.addAction({
            id: actionReplace,
            label: 'math: 替换标点符号',
            keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
            run: editor => {
                let content = editor.getValue().replaceAll('\r\n', '\n')

                replaceList.forEach(([source, target]) => content = content.replaceAll(source, target))
                content = content.split('\n').map(line => {
                    const pos = line.search(/\S/)
                    return pos === -1 ? '' : line.slice(0, pos) + line.slice(pos).trimEnd().replace(/\s+/g, ' ')
                }).join('\n').replace(/\s*$/, '\n')

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
        if (changedKeys.includes(settingList as any)) {
            replaceList = parse(settings[settingList])
        }
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })