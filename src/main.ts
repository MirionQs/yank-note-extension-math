import background from './background'
import markdownKatex from './markdown-katex'
import markdownMathEnv from './markdown-math-env'
import replacePunctuation from './replace-punctuation'
import refresh from './refresh'

[
    background,
    replacePunctuation,
    markdownKatex,
    markdownMathEnv,
    refresh
].forEach(plugin => plugin())