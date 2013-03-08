/*! TinyLoader v0.1.2 | (c) 2013 Nick Herro | This content is released under the MIT License. */
function TinyLoader(debug) {
  // make sure there is only one instance
  if (arguments.callee._tinyLoaderInstance)
    return arguments.callee._tinyLoaderInstance;
  arguments.callee._tinyLoaderInstance = this;

  var self = this;

  debug = debug || false;

  // private
  var handler = {}, frequency = 100, timeout = 70;

  function checkDeps(url) {
    if (debug) console.log("checking dependencies for " + url);
    var i, dep;
    if (handler[url].deps !== null && handler[url].deps.length) {
      // make sure these are loaded before we run our callback
      for (i in handler[url].deps) {
        dep = handler[url].deps[i];
        if (!handler[dep].loaded) {
          if (debug) console.log(dep + " is not loaded yet.  checking again in " + frequency + "ms");
          // at least one dependency is not loaded, loop back and check again
          if (handler[url].checked < timeout) {
            setTimeout(function() { checkDeps(url); }, frequency);
            handler[url].checked ++;
            return;
          } else {
            alert("Failed to load dependencies for " + url);
            return;
          }
        }
      }
    }
    // either there are no dependencies, or they're all loaded - good to go
    processQueue(url);
  }

  function processQueue(url) {
    if (debug) console.log("processing queue for " + url);
    while(handler[url].queue.length > 0) {
      handler[url].queue.shift().call();
    }
  }

  function loaded(url) {
    if (debug) console.log(url + " is loaded");
    handler[url].loaded = true;
    checkDeps(url);
  }

  function add(element) {
    self.target.appendChild(element);
  }

  // public
  this.target = document.getElementsByTagName('head')[0];

  this.addScript = function(context) {
    if (context.loaded === true) {
      // the library has already been loaded.  add this to our handler as if it
      // were loaded and run the callbacks
      handler[context.url] = {
        deps: context.deps || null,
        loaded: true,
        queue: [context.callback]
      };
      if (debug) console.log(context.url + " is already loaded");
      checkDeps(context.url);
    } else {
      if (debug) console.log("\nloading " + context.url);
      var element = document.createElement('script');
      element.type = 'text/javascript';
      element.src = context.url;
      if (context.callback) {
        // add the script to our handler
        if (handler[context.url]) {
          if (handler[context.url].loaded) {
            checkDeps(context.url);
          } else {
            handler[context.url].queue.push(context.callback);
          }
        } else {
          handler[context.url] = {
            deps: context.deps || null,
            checked: 0,
            loaded: false,
            queue: [context.callback]
          };
        }
        // now add the listener
        if (element.addEventListener) {
          element.addEventListener('load', function() { loaded(context.url); }, false);
        } else if (element.attachEvent) {
          // IE
          element.attachEvent('onreadystatechange', function() {
            if (element.readyState === 'loaded' || element.readyState === 'complete') {
              loaded(element.src);
            }
          });
        }
      }
      // finally, add the script tag to the DOM
      add(element);
    }
  }
}
