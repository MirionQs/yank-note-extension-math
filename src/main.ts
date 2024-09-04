import markdownKatex from './markdown-katex'
import markdownTheorem from './markdown-theorem'
import replacePunctuation from './replace-punctuation'

[
    markdownKatex,
    markdownTheorem,
    replacePunctuation
].forEach(plugin => plugin())