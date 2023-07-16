import editorBackground from './editor/background'
import editorHotkey from './editor/hotkey'
import editorReplace from './editor/replace'
import markdownCite from './markdown/cite'
import markdownKatex from './markdown/katex'
import markdownMathEnv from './markdown/math-env'
import markdownTable from './markdown/table'
import markdownTikzjax from './markdown/tikzjax'
import markdownToc from './markdown/toc'

[
    editorReplace,
    editorHotkey,
    editorBackground,
    markdownCite,
    markdownKatex,
    markdownMathEnv,
    markdownTable,
    markdownTikzjax,
    markdownToc
].forEach(plugin => plugin())