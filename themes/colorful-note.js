let css = env.generate()
for (const name in env.data) {
    const data = env.get(name)

    // background   hsv(h, 0.07, 1)
    css += data.hue !== undefined ? `
.theorem[env-name="${name}"] {
    background-color: hsla(${data.hue}, 100%, 86%, 25%);
}
`: `
.theorem[env-name="${name}"] {
    padding: 0;
}
`
    if (data.proof) {
        css += `
.theorem[env-name="${name}"] {
    font-family: CMUSerif, SourceHanSerif;
    page-break-inside: auto;
}

.theorem[env-name="${name}"]::after {
    content: "";
}

.theorem[env-name="${name}"] > .theorem-info::before,
.theorem[env-name="${name}"] > .theorem-info::after {
    font-family: CMUSerif, KaiTi;
    font-weight: normal !important;
}
`
    }
}
return css