import background from './background'
import markdownKatex from './markdown-katex'
import markdownMathEnv from './markdown-math-env'
import replacePunctuation from './replace-punctuation'

[
    background,
    replacePunctuation,
    markdownKatex,
    markdownMathEnv
].forEach(plugin => plugin())