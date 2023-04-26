import { registerPlugin } from "@yank-note/runtime-api"

const name = 'extension-math.markdown.toc'

export default () => {
    registerPlugin({
        name,
        register: ctx => {
            // const children = []

            // ctx.markdown.registerPlugin(md => {
            //     const defaultHeading
            //     const defaultLHeading

            //     md.block.ruler.at('heading', (state, start, end, silent) => {
            //         const result = defaultHeading(state, start, end, silent)

            //     })
            // })
        }
    })
}