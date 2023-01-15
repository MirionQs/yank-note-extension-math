import { registerPlugin } from "@yank-note/runtime-api"

const path = nodeRequire('path')
const fs = nodeRequire('fs-extra')

const pluginName = 'extension-math.markdown.katex'
const pluginKey = 'extension-math.katex-config-path'

export default () => {
	registerPlugin({
		name: pluginName,
		register: async ctx => {

			const constant = await ctx.api.rpc('return require("./constant")')

			const defaultPath = path.join(constant.USER_DIR, 'katex-config.json')
			const configPath = ctx.setting.getSetting(pluginKey, defaultPath)

			fs.ensureFileSync(configPath)

			ctx.setting.changeSchema(schema => {
				schema.properties[pluginKey] = {
					title: 'KaTeX 配置文件路径',
					group: 'other',
					type: 'string',
					required: true,
					defaultValue: defaultPath,
					validator: (_schema, value, path) => {
						return fs.pathExistsSync(value) && fs.statSync(value).isFile() ?
							[] : [{ property: pluginKey, path, message: '路径无效' }]
					}
				}
			})

			const readConfig = (p: string) => {
				if (!path.isAbsolute(p)) {
					p = path.join(path.dirname(ctx.store.state.currentFile!.absolutePath), p)
				}
				try {
					return fs.readJsonSync(p)
				}
				catch {
					console.error(`[${pluginName}] KaTeX 配置文件读取失败，位于 ${p}`)
					return {}
				}
			}

			const options: any = {
				throwOnError: false,
				globalGroup: true,
				output: 'html',
				trust: true
			}

			ctx.registerHook('MARKDOWN_BEFORE_RENDER', ({ env }) => {
				Object.assign(options, readConfig(configPath))
				const macros = options.macros ?? {}

				const fmOptions = env.attributes?.katex ?? {}
				if (fmOptions.import instanceof Array) {
					for (const p of fmOptions.import) {
						const impOptions = readConfig(p)
						Object.assign(options, impOptions)
						Object.assign(macros, impOptions.macros)
					}
				}

				Object.assign(options, fmOptions)
				options.macros = Object.assign(macros, fmOptions.macros)
			})

			ctx.registerHook('PLUGIN_HOOK', ({ plugin, type, payload }) => {
				if (plugin === 'markdown-katex' && type === 'before-render') {
					Object.assign(payload.options, options)
					if (payload.options.keepDisplayMode && !payload.options.displayMode) {
						payload.latex = '\\displaystyle ' + payload.latex
					}
				}
			})

			ctx.view.refresh() // 清除初始渲染的缓存

		}
	})
}