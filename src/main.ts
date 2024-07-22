import background from './background'
import markdownKatex from './markdown-katex'
// import markdownTheorem from './markdown-theorem'
import markdownTheorem from './markdown-math-env'
import replacePunctuation from './replace-punctuation'

[
    background,
    markdownKatex,
    markdownTheorem,
    replacePunctuation
].forEach(plugin => plugin())