[![Netlify Status](https://api.netlify.com/api/v1/badges/0c76358f-a3f9-45c4-b16c-d4ad4017ad5c/deploy-status)](https://app.netlify.com/sites/wasm-masm-x86-editor/deploys)

# WASM MASM x86 Editor

WASM MASM x86 Editor is a portable x86 Microsoft Assembly Language (MASM) code compiler, linker, runner and editor packaged with the [Irvine Library](http://asmirvine.com/)

This app is made possible through the use of [JWlink and JWasm](https://github.com/JWasm) to compile x86/x64 MASM and a 32-bit wine terminal to execute x86 executable binaries using [Boxedwine](http://www.boxedwine.org/) emscripten port. The text editor functionality is provided by [CodeMirror](https://codemirror.net/)

![preview gif](https://i.imgur.com/qw5RLa1.gif)

**WARNING the web version is 45mb in size**.  
The web version can be viewed [HERE](https://wasm-masm-x86-editor.netlify.app/).

## TODO

- shrink boxedwine.zip for web version
- Implement add vim and font size adjustment in editor
- Add resizable components
- Implement workers to improve performance
- Implement nicer theme for editor (have a dark and light option) possible theme switching
- Add proper syntax highlighting
- Add automatic Irvine library on upload
- Add Project save and load (save local storage states)
- Add multiple file addition in createfile window
- Fix spacing of main banner items
- Refactor code

## Bugs

- Add escape key to exit modals (about)
- create/delete/rename file all buggy (easy to break, and get file not present bug)
- error handling on boxedwine
- Check asm files for correct irivine import before compile/link to prevent hard crash
- Add throttling to buttons
- deal with hard and soft crashes in a more graceful way (refresh iframe)
- remove javascript exception printout executed by boxedwine on iframe