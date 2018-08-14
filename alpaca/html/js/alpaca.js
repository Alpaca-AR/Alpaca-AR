var Alpaca = (function() {
  var hostname = window.location.host,
    prefix = "store",
    listeners = [];

  /**
   * Type Checker.
   *
   * Checkes the type of passed varaible if it's expected.
   *
   * @access private
   *
   * @memberof Alpaca
   *
   * @param {any}    variable The variable to check the type of
   * @param {String} name     The name of the variable
   * @param {String} type     The expected type of the variable
   *
   * @return {any} returns the variable if the type is correct
   */
  var checkType = function(variable, name, type) {
    return typeof variable === type ? variable : throwTypeError(name, type);
  };

  /**
   * Throw Type Error
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
    throw new TypeError(`'${name} is not ${article} ${type}`, "alpaca.js");
  };

  /**
   * Fetch Data
   *
   * Sends a request to the store to get/receieve data
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
    if (typeof body !== "undefined")
      options.body = body;

    namespace = checkType(namespace, "namespace", "string");
    name = typeof name !== "undefined" ? checkType(name, "name", "string") : "";

    return fetch(`http://${hostname}/${prefix}/${namespace}/${name}`, options);
  };

  var addEventListener = async function(type, threeObject, callback, namespace) {
    type = checkType(type, "type", "string");
    threeObject = checkType(threeObject, "threeObject", "object");
    callback = checkType(callback, "callback", "function");
    namespace = checkType(namespace, "namespace", "string");

    let promise = makeRequest("POST", 'application/javascript', {}, namespace);

    await promise
      .then(d => d.json())
      .then(d => {
        let name = d.data.url.split('/')[3];
        threeObject.userData.type = type;
        threeObject.userData.name = name;
        threeObject.userData.namespace = namespace;
        this.listen(namespace, name, callback);
      });

    return promise;
  }


  /**
   * Configure Alpaca
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
    if (typeof options.host !== "undefined") {
      options.host = checkType(options.host, "host", "string");
      hostname = options.host;
    }
    if (typeof options.prefix !== "undefined") {
      options.prefix = checkType(options.prefix, "prefix", "string");
      prefix = options.prefix;
    }
  };

  /**
   * Create Object
   *
   * Create an object in the store at store/namespace/
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
   * Listen For Changes
   *
   * Listen for changes to an object at store/namespace/name
   *  and execute a callback when a change occurs.
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String} namespace
   * @param {String} name
   * @param {function} onMessage
   * 
   * @return {Object} A fetch promise
   */
  var listen = async function(namespace, name, onMessage) {
    return await new Promise(resolve => {
      let ws = new WebSocket(`ws://${hostname}/${prefix}/${namespace}/${name}`);
      ws.onmessage = onMessage;
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(ws);
      if (ws.readyState === WebSocket.OPEN) ws.onopen();
    });
  };

  /**
   * Load Object
   *
   * Load the object from the store at store/namespace/name
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
   * Update Object
   *
   * Update an object in the store at store/namespace/name
   *
   * @access public
   *
   * @memberof Alpaca
   *
   * @param {String} contentType The content type header
   * @param {Object} body        The body to be sent
   * @param {String} namespace   The namespace the fetch is to be sent
   * @param {Stirng} name        The name of the object in the store
   *
   * @return {Object} A fetch promise
   */
  var update = async function(contentType, body, namespace, name) {
    return makeRequest("PUT", contentType, body, namespace, name);
  };

  return {
    addEventListener,
    configure,
    create,
    listen,
    load,
    update
  };
})();
