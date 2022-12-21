import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math-editor-markdown-math-env'

export default () => {
	registerPlugin({
		name: pluginName,
		register: ctx => {
			// TODO: 兼容动态修改主题
		}
	})
}