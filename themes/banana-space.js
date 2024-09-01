let css = env.generate()
for (const name in env.data) {
    const data = env.get(name)

    // text         hsv(h, 0.9, 0.8)
    // border       hsv(h, 0.5, 1)
    // background   hsv(h, 0.05, 1)
    css += data.hue ? `
.theorem[env-name="${name}"] {
    border-left: 3px solid hsl(${data.hue}, 100%, 75%);
    background-color: hsla(${data.hue}, 100%, 88%, 20%);
}

.theorem[env-name="${name}"] > .theorem-info {
    color: hsl(${data.hue}, 82%, 44%);
}

[app-theme=dark] .theorem[env-name="${name}"] > .theorem-info {
    color: hsl(${data.hue}, 82%, 56%);
}

@media (prefers-color-scheme: dark) {
    [app-theme=system] .theorem[env-name="${name}"] > .theorem-info {
        color: hsl(${data.hue}, 82%, 56%);
    }
}
`: `
.theorem[env-name="${name}"] {
    padding: 0;
}
`
    if (data.proof) {
        css += `
.theorem[env-name="${name}"] {
    page-break-inside: auto;
}
.theorem[env-name="${name}"]::after {
    content: "";
}
`
    }
}
return css