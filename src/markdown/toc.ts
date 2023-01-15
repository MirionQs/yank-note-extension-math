import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.markdown.toc'

export default () => {
	registerPlugin({
		name: pluginName,
		register: ctx => {

		}
	})
}