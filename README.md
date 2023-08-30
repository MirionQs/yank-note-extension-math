# Yank Note 数学扩展

- 实用功能
  - 自定义背景图
  - 中文标点替换
  - 快捷键支持
- 语法增强
  - 引用
  - 数学环境
  - TikZJax
  - 表格增强
  - 目录增强
  - KaTeX 增强
- 主题样式
  - Banana Space
  - Cyb's Note
  - LaTeX

## 实用功能

### 自定义背景图

- 外观设置中添加了 `背景图路径`、`背景图不透明度` 选项
- 命令面板中添加了 `math: 切换背景图` (`Shift+Alt+B`) 选项

### 中文标点替换

- 命令面板中添加了 `math: 将中文标点替换为英文标点` (`Shift+Alt+R`) 选项。

### 快捷键支持

## 语法增强

### 引用

### 数学环境

#### 命令列表

- `\begin{env}[label]`
  `env`：环境名，要求符合正则表达式 `[a-zA-Z@]+\*?`
  `label`：标签
  开始一个环境
- `\end{env}`
  `env`：环境名，要求符合正则表达式 `[a-zA-Z@]+\*?`
  结束一个环境
- `\setcounter{counter}{value}`
  `counter`：计数器标识，要求符合正则表达式 `[a-zA-Z-]+`
  `value`：要设置的值，要求是一个整数
  重设计数器
- `\newtheorem{name}[counter]{text}[level][attrs]`
  `name`：环境名，要求符合正则表达式 `[a-zA-Z@]+`
  `counter`：计数器标识，要求符合正则表达式 `[a-zA-Z-]+`
  `text`：显示文本
  `level`：计数器层级，要求是 0-6 的整数
  `attrs`：环境属性，要求是合法的 JSON 表达式
  新增定理类环境

#### 调试

- 设置 `mathEnvDebug: true` 启用控制台调试
- 默认启用代码换行，即 `wrapCode: true` ，可覆盖
- 数学环境的动态样式来自于样式文件中的注释块 `MathEnv Template` 和 `MathEnv Environment`

### TikZJax

### 表格增强

### 目录增强

### KaTeX 增强

- 命令面板中添加了 `math: 打开 KaTeX 配置文件` 选项
- 添加了 KaTeX 配置项 `keepDisplayMode` ，设置为 `true` 将统一以行间模式渲染

> 关于 KaTeX 的配置项可以参考 [官方文档](https://katex.org/docs/options.html)

## 主题样式

### Banana Space [预览](https://pic2.imgdb.cn/item/64586b980d2dde5777557ea5.png)

- 仿香蕉空间主题
- 支持数学环境
- 支持暗色主题
- 行内公式、公式中CJK字符两侧自动添加空格
- 附有 `.auto-invert` 属性的标签在暗色模式下会自动反色
- 附有 `.skip-number` 属性的标题将跳过编号
- 一级标题后尾随的段落具有独特样式

### Cyb's Note [预览](https://pic2.imgdb.cn/item/64586b980d2dde5777557e4a.png)

- 仿 Cyb 笔记主题
- 支持数学环境
- 支持暗色主题
- 行内公式、公式中CJK字符两侧自动添加空格
- 附有 `.auto-invert` 属性的标签在暗色模式下会自动反色
- 附有 `.skip-number` 属性的标题将跳过编号
- 一级标题后尾随的段落具有独特样式
- 附有 `.reference` 属性的二级标题具有独特样式

## TODO 咕咕咕

- 添加表格单元格合并语法
- 添加引用语法
- 添加 `LaTeX` 主题
- 支持在目录中渲染 Markdown 行内语法
- 添加 `math: 插入/移除默认 KaTeX 配置` 提高兼容性
- 改进数学环境语法的动态样式安全问题
- 添加设置选项启用/禁用各模块功能
- 添加加粗、倾斜等快捷键
- 增加 `TikZJax` 支持
- 自动将加粗、倾斜语法应用到数学公式
- 添加命令 `\addstyles` 来插入样式