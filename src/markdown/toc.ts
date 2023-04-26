import { registerPlugin } from "@yank-note/runtime-api"

const name = 'extension-math.markdown.toc'

export default () => {
    registerPlugin({
        name,
        register: ctx => {

            // ctx.markdown.registerPlugin(md => {
            //     // TOC 应该是 block 语法而不是 inline 语法
            //     md.block.ruler.before('paragraph', 'toc', (state, start, end) => {
            //         const pos = state.bMarks[start] + state.blkIndent[start]

            //         if (state.src[pos] !== '[') {
            //             return false
            //         }

            //         if (!state.src.startsWith('[toc]', pos)) {
            //             return false
            //         }

            //         return true
            //     })
            // })
        }
    })
}