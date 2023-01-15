import { registerPlugin } from '@yank-note/runtime-api'

const fs = nodeRequire('fs-extra')

const pluginName = 'extension-math.editor.background'
const pluginKeyPath = 'extension-math.background-path'
const pluginKeyOpacity = 'extension-math.background-opacity'

export default () => {
	registerPlugin({
		name: pluginName,
		register: ctx => {
			const head = document.getElementsByTagName('head')[0]
			const style = document.createElement('style')

			head.appendChild(style)

			const refreshBackground = (path: string, opacity: number) => {
				style.innerHTML = `
					#app::before {
						content: "";
						width: 100%;
						height: 100%;
						position: absolute;
						z-index: 1000000;
						pointer-events: none;
						background: url("${path.replaceAll('\\', '/')}") no-repeat center/cover;
						opacity: ${opacity / 2};
					}
				`
			}

			refreshBackground(ctx.setting.getSetting(pluginKeyPath, ''), ctx.setting.getSetting(pluginKeyOpacity, 0.15))

			ctx.setting.changeSchema(schema => {
				schema.properties[pluginKeyPath] = {
					title: '背景图路径',
					group: 'appearance',
					type: 'string',
					required: true,
					defaultValue: '',
					validator: (_schema, value, path) => {
						return value === '' || fs.pathExistsSync(value) && fs.statSync(value).isFile() ?
							[] : [{ property: pluginKeyPath, path, message: '路径无效' }]
					}
				}
				schema.properties[pluginKeyOpacity] = {
					title: '背景图不透明度',
					group: 'appearance',
					type: 'number',
					required: true,
					defaultValue: 0.5,
					minimum: 0,
					maximum: 1
				}
			})

			ctx.registerHook('SETTING_CHANGED', ({ changedKeys, settings }) => {
				if (changedKeys.includes(pluginKeyPath as any) || changedKeys.includes(pluginKeyOpacity as any)) {
					refreshBackground(settings[pluginKeyPath], settings[pluginKeyOpacity])
				}
			})
		}
	})
}