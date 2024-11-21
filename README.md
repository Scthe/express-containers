# Express Containers ([DEMO](https://scthe.github.io/express-containers/))


Running the Express server in the web browser is [not new](https://glebbahmutov.com/blog/run-express-server-in-your-browser/). It's the entire reason why [Browserify](https://browserify.org/) exists. But it's 2024 so we can do better:

* **Live code edit.** I give you a text editor, what you do with it is up to you. Click the **"Start the server"** button to start the app.
    * Ever wanted to delete the whole content of `node_modules/express/lib/application.js`?
    * Edit `$__node-std-lib/_monkey_patch.js` to change node's `process` shim. E.g. silence Express' debug logs by removing the `DEBUG` key in `process.env`.
    * Yes, you can change the Express server port. My shim even allows negative ports, but let's keep that as a secret between us.
* Your **Express code does not run in the same environment as the main page**. It's encapsulated inside the Wasm-ed [QuickJS JavaScript engine](https://bellard.org/quickjs/). This app ships with a separate JS engine.
    * Do not try to access `window` from your code, it will not work.
* **Automatically intercept network requests** using a service worker. The app can get the content from the Express server using both `fetch("http://localhost:3000/...)` and an iframe. Both requests will show up in the dev tools network tab.
    * Iframes can only work through service workers.
    * Service workers can be a bit painful. By default, `fetch()` forwards the request to QuickJS. Web browser's `fetch()` never executes, my button's `onClick` handler calls the function on the QuickJS's context instead. You can switch this off with a toggle.
* **If you do something bad, refresh the page.** You get fresh, new, and untouched files.

> This app is a proof of concept. The code quality is terrible and I only implemented whatever was needed to make it not crash. E.g. from `node:fs` you only get `stat()` and `createReadStream()`. That's enough to return static files (`app.use(express.static('public'));`). If the app does not work, check [WebContainers troubleshooting](https://developer.stackblitz.com/platform/webcontainers/browser-config). I'm not affiliated with them, but it's a technology similar to mine.

<br />
<br />


https://github.com/user-attachments/assets/d77f3e78-2877-4f5b-ac5a-8357364b614e


*Start the Express server and execute a simple request against it. The request object is send directly to the QuickJS, without executing a network request. Edit the endpoint handler and restart the server to see the changed response.*

<br />
<br />

https://github.com/user-attachments/assets/ad773417-d2e7-4fcf-8978-e298ebba3504


*Using service workers to intercept network requests for iframes and `fetch()`. I've shown browser network DevTools at the bottom. The user navigates inside the iframe. The initial index.html file is loaded from `express.static()` directory.*

<br />
<br />


## How does this work?

### During the GitHub actions workflow

My app cannot download stuff from the npm repository (see FAQ). Thus, I download all Express' dependencies during the app build. They are a 3.6 MB zip archive (`vfs.zip`). I've also added a few files with shims so we do not have to request them later.

### App initialization

1. Download `vfs.zip`, unpack it (in memory), and create a virtual filesystem (my custom `VirtualFS` structure).
2. Instantiate `QuickJSRuntime`. This is a generic QuickJS structure that does not do much by itself.
    1. We override its module resolution mechanism (what happens when QuickJS sees an `import` statement). This is only used for `node:fs` and `node:net` - see bundler notes below.
3. Show the UI to the user.

### Start the Express server

1. Bundle the code using `@rollup/browser` (uses Wasm internally).
    1. One of the main problems is rewriting CommonJS (`const fs = require('fs');`) statements. Browsers only support official ECMAScript modules (`import * as fs from 'node:fs';`).
    2. I've written a custom Rollup plugin to redirect file access to my `VirtualFS` structure. E.g. Rollup asks for `"express"` and I resolve it as a string containing the file's content.
        1. My module resolution logic is.. simplified.
    3. I also ported Rollup's CommonJS and JSON plugins to work in a web environment. E.g. dynamic imports are not supported.
2. Now we have a string that contains the app's code.
3. Create a separate virtual filesystem for the finished bundle. Think of it as the `/build` folder. Let's call it `vfs-2`.
    1. Write the bundled app code into `vfs-2`'s `/index.js`.
    2. Add some special files to `vfs-2`. E.g.:
        1. `$__monkey_patch.js` is a script that initializes the exec environment (e.g. sets `globalThis.process`, that you know from Node).
    3. Copy `/public` from the original filesystem to `vfs-2`. Needed to handle requests for static files.
    4. `QuickJSContext` will have access to every file inside `vfs-2`.
4. Create `QuickJSContext` from `QuickJSRuntime`. It's the thing that actually executes the code.
    1. Inject code to handle `console.log()`, `setTimeout()`. These do not exist in QuickJS by default.
    2. Inject code that QuickJS uses to communicate with the web browser. It can:
        1. Request files from the `vfs-2` filesystem using `node:fs`.
        2. Inform the browser that Express finished initialization. Includes info about the server's port.
    3. Run my special `$__monkey_patch.js` script to set globals e.g. `process`.
5. Start the server by executing the app's script. It's the code we generated using Rollup. Accessed as `vfs-2`'s `/index.js`.
6. Notify the web browser that Express is up and running.

## Send the request - the easy way

This is the easy way to send a request to the Express server. It does not involve service workers.

1. Express is already running in our QuickJS context.
    1. The definition of `running` is a peculiar one. QuickJS context has a state stored in the memory and we can call another script to execute against it. This memory contains info about the Express app. The app is not "running", "waiting", or "epoll()-ing". It exists in the memory.
2. Web browser calls a method we added to QuickJS context's `globalThis`.
    1. Look for `forwardRequestToVM(port=_, pathname=_)` log.
    2. In code: `const result = quickJsContext.callMethod(portListeners, 'invoke', [portHandle, pathnameHandle]);`
3. QuickJS runs the entire Express to generate a response.
4. The web browser receives a response by unmarshaling the `result` variable. See the sample code from point 2.
5. The response is a regular JS object with properties like `statusCode`, `headers`, and `data`. We are done.

### Send the request - service workers

Instead of calling `context.callMethod()`, we do an actual network request. This way we can pretend everything is normal. The request will show up in the dev tools. We can handle even an `<iframe>`.

1. Do the network request using `fetch()`  or `<iframe>`.
2. The service worker intercepts the request. It uses `postMessage()` to send a message back to the web page.
3. The web page calls `quickJsContext.callMethod()` as described in "the easy way" section.
4. The web page uses `postMessage()` to send the response back to the service worker.
5. The service worker gets the response and uses it to fulfill the original request.

In retrospect, it might have been better to run everything inside a service worker. Not sure if that's possible though.


## Usage

1. `yarn install`
2. `cd example-app && yarn install` - install dependencies for the Express app.
3. `cd ../extra-dependencies && yarn install` - install extra dependencies required by Rollup and shims.
4. `cd ..`
5. `yarn run:gen-fs` - create an initial filesystem (`"vfs.zip"` file).
6. `yarn dev` - start the dev server
7. Go to [http://localhost:8000/](http://localhost:8000/).

Or, `yarn build` builds the prod version into `./build`.

You can also run the app in node using `yarn run:node`. It is a combination of 3 commands:

1. `yarn run:gen-fs`.  Create an initial filesystem .zip file (same as above).
2. `yarn run:bundler`. Bundle the app code into `./static/bundled-express.js`.
3. `yarn run:app`. Run the bundled app. Endpoint hardcoded to `/hello?param0=1&param2`.


## FAQ

### But why?

> Don't ask me, you are the one who has already read half of this readme.

After [nanite WebGPU](https://github.com/Scthe/nanite-webgpu) I was interested in WebAssembly. It allowed me to run [Metis](https://github.com/KarypisLab/METIS) and [meshoptimizer](https://github.com/zeux/meshoptimizer) (both written in C) inside a web browser. What other things can it do?

I also was curious about Edge computation environments (like Next.js's middleware). They are limited in capabilities and run JavaScript. This led to QuickJs, etc.

Express is... Express. Makes for a cool demo.

### What's needed to finish this?

You have to port the entire node API into the browser. There are a lot of shims already on npm, but all of them need updating. E.g. The virtual filesystem is partially done. No permissions or stats, but you have basic files and directories.

You also do not have access to the operating system API. This is a problem e.g. for `node:crypto`.

Seems like a lot of work. I'm happy with my proof of concept. If you ever wanted to do something similar, at least now you know where to start.

### Why QuickJS?

I was interested in edge computing, Next.js' middleware in particular. It runs a [gutted JS environment](https://wintercg.org/). As for usage, think of nginx's Lua scripts.

The main goal is to isolate the data. I have strict control over what is sent to QuickJS. If QuickJS crashes, I can restart it. For example, each Express request is reduced to a `(port, pathname, query string)` tuple. I remove all request headers as none of the examples use them. It's a separate JS environment with strict API boundaries.

An interesting experiment. And it works. In practice, it should be possible to get similar guarantees from web workers.

### Is there a simpler way?

Probably. There were a lot of blind alleys in this project. I'm just releasing some version that somehow works.


### What's the "vfs.zip"?

"vfs.zip" is the initial state of the virtual filesystem. It mainly contains the express app and its' `node_modules`. The first thing my app does is unpack it and shove the data into my own `VirtualFS` structure. I also added a few of my internal files.

The file is built during the GitHub actions workflow. Reasons to not fetch packages from npm at runtime:

* Suboptimal startup time.
* CORS error.
    * To bypass this, it's customary to use a proxy server between the webpage and the npm repository. I ain't paying for that.
* I'd rather not build a separate package manager.

In the end, everything lands in my  `VirtualFS` structure. And this is where the fun part begins.

> PS. After the app is bundled into a single file it gets its separate filesystem. Think of something like a `/build` directory with artifacts. It contains the final code, 3 JS files with shims, and content of the Express app's `/public` to serve static files. You can preview it using a toggle in the `Files` panel if the server is running.


### What's the difference to v86?

[v86](https://github.com/copy/v86) emulates the entire CPU. It can run both Linux and Windows. I monkey-patched some JavaScript when Express threw errors. There are no similarities between our projects.

### What's the difference to WebContainers?

I'm not sure how StackBlitz's WebContainers work, but the main purpose is similar. The user gets to change files in a virtual filesystem and run newly written node code inside the browser. All with a single button click, no external connection is required. The basic problems are similar. E.g. They also have to handle CommonJS (`const fs = require('fs')`) as it's not supported in web browsers.

I admit I did not research much of their technology. Can all their features be supported just by JS/Wasm shims? What about natively compiled packages? There is a way to inject the non-compiled versions, but it seems like a lot of "fix error after error till it works" programming. Looking at their marketing materials they ported e.g. `npm`, `pnpm`, and `yarn`. I never looked at how package managers work.

I'm not sure if they use a separate JavaScript environment (QuickJS for me). How do you stop access to global variables? Half of the npm checks for `window` to make decisions at runtime. You can sidestep this problem with bundling. Even simple Immediately Invoked Function Expressions (IIFE) allow total control over code dependencies. But you also have to deal with all other global stuff like `location`, `URL`, and `document`. You can (**should**) use web workers. Not sure how much API they leak. With QuickJS I ignore the problem. It does not have variables from the browser (e.g. `window`) or node (e.g. `process`). I even got to write my own (quasi) event loop.

[How do they deal with](https://medium.com/stackblitz-blog/introducing-turbo-5x-faster-than-yarn-npm-and-runs-natively-in-browser-cc2c39715403) 1+ GB of `node_modules` that are needed by seemingly every node app? It has to be downloaded and persisted. I heard indexed DB is used for storage in similar cases.

Looking at StackBlitz's career page, they want TypeScript and Rust. I know Rust has some ABI problems with Wasm e.g. compatibility with C (which might be needed?). I think a lot of choice is limited by easy access to Wasm modules. Unless you rely on many in-house libraries or Rust std lib (is it Wasm-compatible?) to help with the implementation. Or glue WebAssembly modules with tons of TS.


### Can this be used with WebRTC?

Sure, why not? Receive a message, format it as a url to QuickJS Express server, and then forward the response to the client. Or use it with service workers. The browser calls `fetch()` which gets intercepted. Congratulations, your browser is now a proxy server.



## Honourable mentions

* [Rollup](https://rollupjs.org/). Never used it before, but works well. Even has a browser version (using Wasm) - perfect! API is as good and enjoyable as `esbuild`, which is rare.
    * The plugin API is a bit strange, but I did not get in-depth into it.
    * [esbuild-wasm](https://www.npmjs.com/package/esbuild-wasm) should also work. Will require custom plugins to handle the virtual filesystem.
* Fabrice Bellard and Charlie Gordon for [QuickJS Javascript Engine](https://bellard.org/quickjs/).
* [kosamari](https://github.com/kosamari) for ["ServiceWorker for github pages"](https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e) notes.

I ran out of [GitHub pinned repos](https://github.com/Scthe)?
