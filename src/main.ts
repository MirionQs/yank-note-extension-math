import background from './background'
import replacePunctuation from './replace-punctuation'
import hotkey from './hotkey'
import markdownKatex from './markdown-katex'
import markdownMathEnv from './markdown-math-env'

[
    replacePunctuation,
    hotkey,
    background,
    markdownKatex,
    markdownMathEnv,
].forEach(plugin => plugin())