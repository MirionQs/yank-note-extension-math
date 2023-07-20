import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.hotkey'

export default () => {
    registerPlugin({
        name: pluginName,
        register: ctx => {
        }
    })
}