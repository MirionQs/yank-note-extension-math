import { registerPlugin } from "@yank-note/runtime-api"

const path = nodeRequire('path')

const pluginName = 'extension-math.markdown.front-matter'

export default () => {
	registerPlugin({
		name: pluginName,
		register: async ctx => {
			// TODO: 导出pdf时主题未应用，水印功能暂缓

			const iframe = document.getElementsByTagName('iframe')[0]
			const link = iframe.contentWindow!.document.getElementById('custom-css')!

			const constant = await ctx.api.rpc('return require("./constant")')

			ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {

				let theme: string = env.attributes?.theme

				if (typeof theme === 'string') {
					if (!path.isAbsolute(theme)) {
						if (/^\.[/\\]/.test(theme)) { // 相对路径
							theme = path.join(path.dirname(env.file?.absolutePath), theme)
						}
						else { // 主题名
							theme = (theme.startsWith('extension:') ?
								path.join(constant.USER_EXTENSION_DIR, theme.slice(10)) :
								path.join(constant.USER_THEME_DIR, theme))
								+ (theme.endsWith('.css') ? '' : '.css')
						}
					}
					link['href'] = theme
				}
				else {
					link['href'] = '/custom-css'
				}

				// const watermark: string = env.attributes?.pdfWatermark
			})
		}
	})
}