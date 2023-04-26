import { registerPlugin } from "@yank-note/runtime-api"

const name = 'extension-math.editor.replace'
const actionReplace = 'extension-math.replace'

const replaceList: [string | RegExp, string][] = [
    ['，', ', '],
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
        name,
        register: ctx => {
            // 命令面板
            ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
                editor.addAction({
                    id: actionReplace,
                    contextMenuGroupId: 'extension-math',
                    label: 'math: 替换中文标点为英文标点',
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