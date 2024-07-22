import { registerPlugin, Ctx } from "@yank-note/runtime-api"

const pluginName = 'extension-math.replace-punctuation'
const actionReplace = 'extension-math.replace-punctuation'

const replaceList: [string | RegExp, string][] = [
    ['，', ', '],
    ['、', ', '],
    ['。', '. '],
    ['？', '? '],
    ['！', '! '],
    ['；', '; '],
    ['：', ': '],
    ['（', ' ('],
    ['）', ') '],
    [/(?<=\S) +/g, ' ']
]

const pluginRegister = (ctx: Ctx) => {
    // 命令面板
    ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
        editor.addAction({
            id: actionReplace,
            label: 'math: 替换标点符号',
            keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
            run: editor => {
                let content = editor.getValue()
                replaceList.forEach(([s, r]) => content = content.replaceAll(s, r))
                editor.executeEdits('replace-punctuation', [{
                    range: editor.getModel()!.getFullModelRange(),
                    text: content
                }])
            }
        })
    })
}

export default () => registerPlugin({ name: pluginName, register: pluginRegister })