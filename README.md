# Appbase JS API

### Libraries used
 * https://github.com/appendto/amplify
     - used for persistent storage and event firing
     - modified its pubsub to give listeners a name
 * https://github.com/then/promise
     - modified for not using `asap` library and calling methods directly
 * https://github.com/es-shims/es5-shim
     - For legacy browsers
 * https://getfirebug.com/releases/lite/1.2/
     - For debugging in legacy browsers
 * https://github.com/monmohan/dsjslib
     - its AVL tree as sorted map for storing edges