import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.replace-punctuation'
const idReplace = 'extension-math.replace-punctuation'

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

export default () => {
    registerPlugin({
        name: pluginName,
        register: ctx => {
            // 命令面板
            ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
                editor.addAction({
                    id: idReplace,
                    label: 'math: 将中文标点替换为英文标点',
                    keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyR],
                    run: editor => {
                        let content = editor.getValue();
                        replaceList.forEach(([s, r]) => content = content.replaceAll(s, r))
                        editor.executeEdits('replace', [{
                            range: editor.getModel()!.getFullModelRange(),
                            text: content
                        }])
                    }
                })
            })
        }
    })
}