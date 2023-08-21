import { registerPlugin } from "@yank-note/runtime-api"

const pluginName = 'extension-math.refresh'

export default () => {
    registerPlugin({
        name: pluginName,
        register: ctx => {
            ctx.view.refresh()
        }
    })
}