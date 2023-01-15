import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.editor.auto-replace'
const pluginKey = 'extension-math.auto-replace'

export default () => {
	registerPlugin({
		name: pluginName,
		register: ctx => {
			// TODO: 多光标、选中区域，保存两次？
			ctx.setting.changeSchema(schema => {
				schema.properties[pluginKey] = {
					title: '自动替换中文标点',
					group: 'editor',
					type: 'boolean',
					format: 'checkbox',
					required: true,
					defaultValue: true
				}
			})

			ctx.registerHook('DOC_BEFORE_SAVE', ({ content }) => {
				if (!ctx.setting.getSetting(pluginKey, true)) {
					return
				}

				const editor = ctx.editor.getEditor()
				editor.focus()

				let { lineNumber, column } = editor.getPosition()!
				const contentBefore = editor.getModel()!.getLineContent(lineNumber).slice(0, column - 1);

				[
					['，', ', '],
					['。', '. '],
					['？', '? '],
					['！', '! '],
					['；', '; '],
					['：', ': '],
					['（', ' ('],
					['）', ') ']
				].forEach(([orig, repl]) => {
					content = content.replaceAll(orig, repl)
					column += contentBefore.split(orig).length - 1
				})

				editor.executeEdits('auto-replace', [{
					range: editor.getModel()!.getFullModelRange(),
					text: content,
				}])
				editor.setPosition({ lineNumber, column })
			})
		}
	})
}