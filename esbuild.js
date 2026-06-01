import esbuild from 'esbuild'
import path from 'path'
const currentDirName = import.meta.dirname;
const cont = await esbuild.build({
    "entryPoints": {
        "main": "./renderer.js"
    },
    bundle: true,
    outdir: path.resolve(currentDirName, "out")
})
console.log("----- WARNINGS -----")
for (let warning of cont.warnings) {
console.log(warning)
}
console.error("------- ERRORS ------ ")
for (let error of cont.errors) {
console.error(warning)
}
console.error()
