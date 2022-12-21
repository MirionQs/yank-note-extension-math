import editorAutoReplace from './editor/auto-replace'
import editorBackground from './editor/background'
import markdownFrontMatter from './markdown/front-matter'
import markdownKatex from './markdown/katex'
import markdownMathEnv from './markdown/math-env'
import markdownReference from './markdown/reference'
import markdownToc from './markdown/toc'

[
    editorAutoReplace,
    editorBackground,
    markdownFrontMatter,
    markdownKatex,
    markdownMathEnv,
    markdownReference,
    markdownToc
].forEach(plugin => plugin())