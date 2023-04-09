import { registerPlugin } from '@yank-note/runtime-api'

const fs = nodeRequire('fs-extra')

const name = 'extension-math.editor.background'
const keyPath = 'extension-math.background-path'
const keyOpacity = 'extension-math.background-opacity'
const actionToggle = 'extension-math.toggle-background'

export default () => {
	registerPlugin({
		name,
		register: async ctx => {
			const style = await ctx.theme.addStyles('')

			const setBackground = (path: string, opacity: number) => {
				style.innerHTML = `#app::before{content:"";width:100%;height:100%;position:absolute;z-index:1000000;pointer-events:none;background:url("${path.replaceAll('\\', '/')}") no-repeat center/cover;opacity:${opacity / 2};}`
			}

			setBackground(ctx.setting.getSetting(keyPath, ''), ctx.setting.getSetting(keyOpacity, 0.3))

			ctx.setting.changeSchema(schema => {
				schema.properties[keyPath] = {
					title: '背景图路径',
					group: 'appearance',
					type: 'string',
					defaultValue: '',
					validator: (_schema, value, path) => {
						return value === '' || fs.pathExistsSync(value) && fs.statSync(value).isFile() ?
							[] : [{ property: keyPath, path, message: '路径无效' }]
					}
				}
				schema.properties[keyOpacity] = {
					title: '背景图不透明度',
					group: 'appearance',
					type: 'number',
					defaultValue: 0.5,
					minimum: 0,
					maximum: 1
				}
			})

			ctx.registerHook('SETTING_CHANGED', ({ changedKeys, settings }) => {
				if (changedKeys.includes(keyPath as any) || changedKeys.includes(keyOpacity as any)) {
					setBackground(settings[keyPath], settings[keyOpacity])
				}
			})

			ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
				editor.addAction({
					id: actionToggle,
					contextMenuGroupId: 'extension-math',
					label: 'math: 启用/禁用背景图',
					keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyB],
					run: () => {
						style.disabled = !style.disabled
					}
				})
			})
		}
	})
}