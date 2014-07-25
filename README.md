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
 * For edges:
     - https://github.com/monmohan/dsjslib: Simple AVL tree as a sorted map - needs a few modifications for an optimized use
     - http://www.collectionsjs.com: SortedMap or SortedSet - with a lot of features and even listeners