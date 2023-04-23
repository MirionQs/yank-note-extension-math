import editorBackground from './editor/background'
import editorReplace from './editor/replace'
import markdownCite from './markdown/cite'
import markdownKatex from './markdown/katex'
import markdownMathEnv from './markdown/math-env'
import markdownTable from './markdown/table'
import markdownToc from './markdown/toc'

[
    editorReplace,
    editorBackground,
    markdownCite,
    markdownKatex,
    markdownMathEnv,
    markdownTable,
    markdownToc
].forEach(plugin => plugin())