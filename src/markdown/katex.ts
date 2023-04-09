import { registerPlugin } from "@yank-note/runtime-api"

const fs = nodeRequire('fs-extra')
const path = nodeRequire('path')

const name = 'extension-math.markdown.katex'
const actionOpen = 'extension-math.open-config'

export default () => {
	registerPlugin({
		name,
		register: async ctx => {
			const constant = await ctx.api.rpc('return require("./constant")')
			const configPath = path.join(constant.USER_DIR, 'katex-config.json')

			fs.ensureFileSync(configPath)

			const readConfig = (filePath: string) => {
				if (!path.isAbsolute(filePath)) {
					filePath = path.join(path.dirname(ctx.store.state.currentFile!.absolutePath), filePath)
				}
				try {
					return fs.readJsonSync(filePath)
				}
				catch {
					console.error(`[${name}] KaTeX 配置文件读取失败，位于 ${filePath}`)
					return {}
				}
			}

			let options

			ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
				options = Object.assign({
					throwOnError: false,
					errorColor: '#f00',
					globalGroup: true,
					trust: true,
					output: 'html',
					strict: false,
				}, readConfig(configPath))
				const macros = options.macros ?? {}

				const fmopts = env.attributes?.katex ?? {}
				if (fmopts.import instanceof Array) {
					for (const filePath of fmopts.import) {
						const opts = readConfig(filePath)
						Object.assign(options, opts)
						Object.assign(macros, opts.macros)
					}
				}

				Object.assign(options, fmopts)
				options.macros = Object.assign(macros, fmopts.macros)
			})

			ctx.registerHook('PLUGIN_HOOK', ({ plugin, type, payload }) => {
				if (plugin === 'markdown-katex' && type === 'before-render') {
					Object.assign(payload.options, options)
					if (payload.options.keepDisplayMode && !payload.options.displayMode) {
						payload.latex = '\\displaystyle ' + payload.latex
					}
				}
			})

			ctx.editor.whenEditorReady().then(({ editor }) => {
				editor.addAction({
					id: actionOpen,
					label: 'math: 打开 KaTeX 配置文件',
					run: () => {
						ctx.base.openPath(configPath)
					}
				})
			})

			ctx.view.refresh()
		}
	})
}