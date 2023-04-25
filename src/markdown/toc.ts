import { registerPlugin } from "@yank-note/runtime-api"

const name = 'extension-math.markdown.toc'

export default () => {
    registerPlugin({
        name,
        register: ctx => {
            ctx.markdown.registerPlugin(md => {
                // md.block.ruler.getRules('heading')
            })
        }
    })
}