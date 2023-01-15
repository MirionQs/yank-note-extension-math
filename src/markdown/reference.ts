import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.markdown.reference'

export default () => {
	registerPlugin({
		name: pluginName,
		register: ctx => {

		}
	})
}