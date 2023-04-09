import editorBackground from './editor/background'
import editorReplace from './editor/replace'
import markdownFrontMatter from './markdown/front-matter'
import markdownKatex from './markdown/katex'
import markdownMathEnv from './markdown/math-env'
import markdownReference from './markdown/reference'
import markdownTable from './markdown/table'
import markdownToc from './markdown/toc'

[
    editorReplace,
    editorBackground,
    markdownFrontMatter,
    markdownKatex,
    markdownMathEnv,
    markdownReference,
    markdownTable,
    markdownToc
].forEach(plugin => plugin())