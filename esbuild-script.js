const esbuild = require('esbuild');
const copyStaticFiles = require('esbuild-copy-static-files');
const postCssPlugin = require('esbuild-style-plugin');

const config = {
  entryPoints: ['./src/app/index.web.tsx', './src/app/service-worker.ts'],
  outdir: './build',
  bundle: true,
  define: {},
  // plugins
  plugins: [
    copyStaticFiles({
      src: './static',
      dest: './build',
      dereference: true,
      errorOnExist: false,
      recursive: true,
    }),
    postCssPlugin({
      postcss: {
        plugins: [require('tailwindcss'), require('autoprefixer')],
      },
    }),
  ],
};

const defineProductionFlag = (flag) =>
  (config.define.IS_PRODUCTION = String(flag));

async function buildProd() {
  console.log('Executing prod build');
  defineProductionFlag(true);

  config.minify = true;
  // config.format = 'esm'; // produces invalid build? some module imports or smth. 'type="module"' in <script>?
  config.sourcemap = true;
  config.target = 'chrome100,firefox100,safari15'.split(',');
  await esbuild.build(config);
  console.log(
    `Build finished sucesfully. The files are in '${config.outdir}' directory.`
  );
}

async function startDev() {
  console.log('Starting dev compile process');
  defineProductionFlag(false);

  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log(`Done. Watching for code changes...`);

  let { host, port } = await ctx.serve({
    servedir: 'build',
  });
  console.log(`Serve: http://localhost:${port}/`);
}

const isDev = process.argv.some((e) => e == '--dev');
if (isDev) {
  startDev();
} else {
  buildProd();
}
