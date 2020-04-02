var Alpaca = (function() {
  var hostname = window.location.host,
    prefix = "store";

  /**
   * Type Checker.
   *
   * Checks the type of passed variable if it is the type expected.
   *
   * @access private
   *
   * @memberof Alpaca
   *
   * @param {any}    variable The variable to check the type of
   * @param {String} name     The name of the variable
   * @param {String} type     The expected type of the variable
   *
   * @return {any} The variable if the type is correct
   */
  var checkType = function(variable, name, type) {
    return typeof variable === type ? variable : throwTypeError(name, type);
  };

  /**
   * Function Invocation Timeout.
   *
   * Prevents function from being invoked more often than every wait ms.
   *
   * @access private
   *
   * @memberof Alpaca
   *
   * @param {Function} func      The function to invoke
   * @param {Number}   wait      The amount of time between allowed invocations
   * @param {Boolean}  immediate If true, ignore the timeout and invoke func anyway
   *
   * @return {Function} The debounce function
   */
  var debounce = function(func, wait, immediate) {
    let timeout;
    return function() {
      let context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      }, wait);
      if (immediate && !timeout) func.apply(context, args);
    };
  };

  /**
   * Fetch Data.
   *
   * Sends a request to the Alpaca store to get/receive data.
   *
   * @access private
   *
   * @memberof Alpaca
   *
   * @param {String} method      Type of fetch call
   * @param {String} contentType The content type header
   * @param {Object} [body]      The body to be sent
   * @param {String} namespace   The namespace the fetch is to be sent
   * @param {String} [name]      Name of the object to get
   *
   * @return {Object} A fetch promise
   */
  var makeRequest = function(method, contentType, body, namespace, name) {
    let options = {};
    options.method = checkType(method, "method", "string");
    options.headers = {
      "Content-Type": checkType(contentType, "contentType", "string")
    };
    if (typeof body !== "undefined") options.body = body;

    namespace = checkType(namespace, "namespace", "string");
    name = typeof name !== "undefined" ? checkType(name, "name", "string") : "";

    return fetch(`http://${hostname}/${prefix}/${namespace}/${name}`, options);
  };

  /**
   * Throw Type Error.
   *
   * Throws a type error with the appropriate name, type, and file.
   *
   * @access private
   *
   * @memberof Alpaca
   *
   * @param {any}    name The name of the variable that failed the type check
   * @param {String} type The expected type of the variable
   *
   * @return {TypeError} throws a TypeError
   */
  var throwTypeError = function(name, type) {
    let article =
      ["a", "e", "i", "o", "u"].indexOf(type.charAt(0).toLowerCase()) !== -1
        ? "an"
        : "a";
    throw new TypeError(`${name} is not ${article} ${type}`, "alpaca.js");
  };

  /**
   * Add Listener to Object.
   *
   * Adds a listener to an object that when triggered,
   *  executes an event on the desktop.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String}   type        The type of event (press, tap, pan, etc)
   * @param {Object}   threeObject The Three.js object that will trigger the event
   * @param {Function} callback    The function to be called when the event occurs
   * @param {String}   namespace   The namespace the object resides in on the store
   *
   * @return {Object} A fetch promise
   */
  var addEventListener = async function(
    type,
    threeObject,
    callback,
    namespace
  ) {
    type = checkType(type, "type", "string");
    threeObject = checkType(threeObject, "threeObject", "object");
    callback = checkType(callback, "callback", "function");
    namespace = checkType(namespace, "namespace", "string");

    let promise = makeRequest("POST", "application/javascript", {}, namespace);

    const ws = await promise.then(resp => resp.json()).then(resp => {
      let name = resp.data.url.split("/")[3];
      threeObject.userData.type = type;
      threeObject.userData.name = name;
      threeObject.userData.namespace = namespace;
      return this.listen(namespace, name, callback);
    });
    
    threeObject._$alpacaEventStream = ws;
  };
  
  var removeEventListeners = (threeObject) => {
    if (!threeObject._$alpacaEventStream) {
      console.warn('no event listeners on object', threeObject);
    } else {
      threeObject._$alpacaEventStream.close();
      delete threeObject._$alpacaEventStream;
    }
  };

  /**
   * Configure Alpaca.
   *
   * Set the Alpaca parameters for fetch calls.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {Object} options The hostname and prefix used for fetch requests
   */
  var configure = function(options) {
    options = checkType(options, "options", "object");

    if (typeof options.host !== "undefined")
      hostname = checkType(options.host, "host", "string");

    if (typeof options.prefix !== "undefined")
      prefix = checkType(options.prefix, "prefix", "string");
  };

  /**
   * Create Object.
   *
   * Create an object in the store at store/namespace/.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String} contentType The content type header
   * @param {Object} body        The body to be sent
   * @param {String} namespace   The namespace the fetch is to be sent
   *
   * @return {Object} A fetch promise
   */
  var create = async function(contentType, body, namespace) {
    return makeRequest("POST", contentType, body, namespace);
  };

  /**
   * Listen For Changes.
   *
   * Listen for changes to an object at store/namespace/name
   *  and execute a callback when a change occurs.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String}   namespace
   * @param {String}   name
   * @param {function} onMessage
   *
   * @return {Object} A fetch promise
   */
  var listen = function(namespace, name, onMessage) {
    return new Promise(resolve => {
      let ws = new WebSocket(`ws://${hostname}/${prefix}/${namespace}/${name}`);
      ws.onmessage = onMessage;
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(ws);
      if (ws.readyState === WebSocket.OPEN) ws.onopen();
    });
  };

  /**
   * Load Object.
   *
   * Load the object from the store at store/namespace/name.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String} contentType The content type header
   * @param {String} namespace   The namespace the fetch is to be sent
   * @param {String} name        The name of the object in the store
   *
   * @return {Object} A fetch promise
   */
  var load = async function(contentType, namespace, name) {
    return makeRequest("GET", contentType, undefined, namespace, name);
  };

  /**
   * Update Object.
   *
   * Update an object in the store at store/namespace/name.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String} contentType The content type header
   * @param {Object} body        The body to be sent
   * @param {String} namespace   The namespace the fetch is to be sent
   * @param {String} name        The name of the object in the store
   *
   * @return {Object} A fetch promise
   */
  var update = async function(contentType, body, namespace, name) {
    return makeRequest("PUT", contentType, body, namespace, name);
  };

  /**
   * Watch DOM.
   *
   * Watch a DOM tree for any changes and when changes occur,
   *  invoke the callback.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {Object}   element    An HTML element
   * @param {Function} callback   Function to be invoked on changes
   * @param {Number}   [delay]    Time to wait between allowed invocations
   * @param {Object}   [config]   MutationObserver config describing what to watch
   *
   * @return {MutationObserver} A MutationObserver
   */
  var watch = async function(element, callback, delay, config) {
    if (!(element instanceof Element))
      throw new TypeError("Element is not an HTML Element.", "alpaca.js");
    callback = checkType(callback, "callback", "function");
    delay = delay ? checkType(delay, "delay", "number") : 250;
    config = config
      ? checkType(config, "config", "object")
      : {
          attributes: true,
          childList: true,
          subtree: true
        };
    let observer = new MutationObserver(debounce(callback, delay));
    observer.observe(element, config);
    return observer;
  };

  return {
    addEventListener,
    removeEventListeners,
    configure,
    create,
    listen,
    load,
    update,
    watch
  };
})();
