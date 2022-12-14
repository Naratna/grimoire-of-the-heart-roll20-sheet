import AdapterStatic from '@sveltejs/adapter-static';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import prettier from 'prettier';
import purifycss from "purify-css"
import uncss from "uncss"

const adapterName = 'sveltekit-adapter-roll20-sheet';

export default (options) => ({
	name: adapterName,
	async adapt(builder) {
		const tempDir = path.join('.svelte-kit', adapterName);
		const name = options.sheetName ?? 'sheet';
		const outDir = options.outDir ?? 'build';
		const author = options.author ?? '';
		/** @type {string} */
		const index = options.mainHtmlFile ?? 'sheet.html';

		const adapterStatic = AdapterStatic({
			...options.adapterStaticOptions,
			pages: tempDir,
			assets: tempDir
		});

		await adapterStatic.adapt(builder);

		if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

		fs.mkdirSync(outDir);

		const files = glob.sync(path.join(tempDir, '*'));

		for (const file of files) {
			const baseName = path.basename(file);
			if (fs.lstatSync(file).isDirectory()) continue;
			if (['manifest.json', 'sheet.overrides.json', 'instructions.md', "vite-manifest.json"].indexOf(baseName) != -1)
				continue;
			fs.copyFileSync(file, path.join(outDir, baseName));
		}

		const assets = glob.sync(path.join(tempDir, "assets", "*"))

		fs.mkdirSync(path.join(outDir, "assets"))

		for (const file of assets) {
			const baseName = path.basename(file);
			if (fs.lstatSync(file).isDirectory()) continue;
			fs.copyFileSync(file, path.join(outDir, "assets", baseName));
		}

		let instructions = '';
		try {
			instructions = fs.readFileSync(path.join(tempDir, 'instructions.md')).toString();
		} catch (e) {
			console.log(e);
		}

		let sheetOverrides = '{}';
		try {
			sheetOverrides = fs.readFileSync(path.join(tempDir, 'sheet.overrides.json')).toString();
			sheetOverrides = JSON.parse(sheetOverrides);
		} catch (e) {
			console.log(e);
		}

		const sheetJson = {
			html: `${name}.html`,
			css: `${name}.css`,
			authors: author,
			roll20userid: '1',
			preview: 'preview.png',
			instructions,
			legacy: false,
			...sheetOverrides
		};

		fs.writeFileSync(path.join(outDir, 'sheet.json'), JSON.stringify(sheetJson, undefined, 4));

		let html = fs.readFileSync(path.join(outDir, index)).toString();
		let cssPath = /<\s*link.*href="(.*\.css)".*>/g.exec(html)?.at(1);
		// let indexSplit = indexHtml.split('<script type="module"');
		// indexSplit[indexSplit.length - 1] = '';
		// indexHtml = indexSplit.join('');
		let indexSplit = html.split('<!-- svelte head end -->');
		indexSplit[0] = '';
		html = indexSplit.join('');
		html = prettier.format(html, { filepath: index });
		fs.writeFileSync(path.join(outDir, index), html);
		fs.renameSync(path.join(outDir, index), path.join(outDir, sheetJson.html));

		let css = '';
		try {
			css = fs.readFileSync(path.join(tempDir, cssPath)).toString();
		} catch (e) {
			console.log(e);
		}

		css = css.replace('@charset "UTF-8";', "")

		const unCssOptions = {
			banner: false,
			ignore: [/\.charactersheet.*/, /\.sheet-rolltemplate.*/, /.*inlinerollresult.*/],
			raw: css
		}

		css = await new Promise((resolve) => {
			uncss(html, unCssOptions, (error, output) => {
				resolve(output)
			})
		})


		cssPath = path.join(outDir, sheetJson.css)
		fs.writeFileSync(cssPath, css)
	}
});
