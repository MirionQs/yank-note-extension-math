import { registerPlugin } from "@yank-note/runtime-api"

const name = 'extension-math.editor.replace'
const actionReplace = 'extension-math.replace'

export default () => {
	registerPlugin({
		name,
		register: ctx => {
			const replace = () => {
				const editor = ctx.editor.getEditor()
				const content = editor.getValue()
					.replace(/ *， */g, ', ')
					.replace(/ *。 */g, '. ')
					.replace(/ *？ */g, '? ')
					.replace(/ *！ */g, '! ')
					.replace(/ *； */g, '; ')
					.replace(/ *： */g, ': ')
					.replace(/ *（ */g, ' (')
					.replace(/ *） */g, ') ')
					.replace(/ *$/mg, '')
				editor.executeEdits('replace', [{
					range: editor.getModel()!.getFullModelRange(),
					text: content,
				}])
			}

			ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
				editor.addAction({
					id: actionReplace,
					contextMenuGroupId: 'extension-math',
					label: 'math: 替换中文标点为英文标点',
					keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyR],
					run: replace
				})
			})
		}
	})
}