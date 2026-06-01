import esbuild from 'esbuild'
import path from 'path'
const currentDirName = import.meta.dirname;
const cont = await esbuild.context({
    "entryPoints": {
        "main": "./renderer.js"
    },
    bundle: true,
    outdir: path.resolve(currentDirName, "out")
})
await cont.watch()
