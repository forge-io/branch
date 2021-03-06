const url = require('url');

/**
 *
 * LeafResult
 */
class LeafResult {
  /**
   * @param {boolean} foundExact Do we have an exact match
   * @param {Map<string, string>} params Any parameters matched in the lookup
   * @param {Leaf} leaf The leaf object
   */
  constructor(foundExact = false, params = {}, leaf = {}) {
    /**
     * @public
     */
    this.foundExact = foundExact;
    /**
     * @public
     */
    this.params = params;
    /**
     * @public
     */
    this.leaf = leaf;
  }
}

/**
 * Leaf
 */
class Leaf {
  /**
   * @param {RegExp} regexp a regexp match for this leaf
   */
  constructor(regexp = null) {
    /**
     * @private
     */
    this.children = {
        strings: {},
        regexps: {}
    };
    /**
     * @private
     */
    this.handlers = {};
    /**
     * @private
     */
    this.regexp = null;
    if (regexp !== null) this.regexp = this.generateRegExp(regexp);
  }

  /**
   * @param {Array<string>} keys - a array of keys
   * @param {string} method - a HTTP method, eg. GET, POST, etc
   * @param {function} handler - the method to return upon a match
   * @public
   */
  add(keys, method, handler) {
    let treePtr = this;
    while(keys.length > 0) {
      let key = keys.shift();
      if (key.indexOf('{') === -1) {
        if (!(key in treePtr.children.strings)) {
          treePtr.children.strings[key] = new Leaf();
        }
        treePtr = treePtr.children.strings[key];
      } else {
        if (!(key in treePtr.children.regexps)) {
          treePtr.children.regexps[key] = new Leaf(key);
        }
        treePtr = treePtr.children.regexps[key];
      }
    }
    treePtr.handlers[method] = handler;
  }


  /**
   * @param {string} key - a URL path fragment
   * @return {RegExp} a RegExp match for the params
   * @private
   */
  generateRegExp(key) {
    let instring = key;
    let regexpString = '';
    while(instring.length > 0) {
      let nextBrace = instring.indexOf('{');
      if (nextBrace === -1) {
        regexpString += instring;
        instring = '';
      } else {
        let afterBrace = instring.indexOf('}', nextBrace);
        let pre = instring.substring(0, nextBrace);
        let key = instring.substring(nextBrace + 1, afterBrace);
        let post = instring.substring(afterBrace + 1);
        instring = post;

        regexpString += `${pre}(?<${key}>.*)`;
      }
    }
    return new RegExp(regexpString);
  }

  /**
   * @param {Array<string>} keys - a array of keys
   * @return {LeafResult}
   * @public
   */
  lookup(keys) {
    let treePtr = this;
    let params = {};
    let numFound = 0;
    const numWanted = keys.length;
    let foundExact = false;
    while(keys.length > 0) {
      let key = keys.shift();
      let leaf = null;
      let found = false;
      if (key in treePtr.children.strings) {
        leaf = treePtr.children.strings[key];
        found = true;
      } else {
        let regexpKeys = Object.keys(treePtr.children.regexps);
        while(regexpKeys.length > 0 && found === false) {
          let regexpKey = regexpKeys.shift();
          leaf = treePtr.children.regexps[`${regexpKey}`];
          let match = leaf.regexp.exec(key);
          if (match) {
            Object.assign(params, match.groups);
            found = true;
          }
        }
      }
      if(found) {
        treePtr = leaf;
        numFound++;
      }

    }
    if (numFound === numWanted) foundExact = true;

    return new LeafResult(
      foundExact,
      params,
      treePtr
    );
  }


}


/**
 * Branch
 */
class Branch {
  /**
   * @return {Branch} return a Branch Class
   */
  constructor() {
    /**
     * @private
     */
    this.tree = new Leaf();
    /**
     * @private
     */
    this.defaultResult = new LeafResult();
  }

  /**
   * @param {string} route - a URL path, eg. /pages/home.html
   * @param {string} method - a HTTP method, eg. GET, POST, etc
   * @param {function} handler - the method to return upon a match
   * @public
   */
  add(route, method, handler) {
    const routeLen = route.length;
    const lastChar = routeLen - 1;
    const noTrailingSlash = (route[lastChar] === '/') ? route.substring(0, lastChar) : route;
    /* istanbul ignore else */
    if (noTrailingSlash.length > 0) {
      const routeParts = noTrailingSlash.substring(1).split('/');
      this.tree.add(routeParts, method, handler);
    }
  }

  /**
   * @param {string} uri - a URI path, potentionally including GET params, eg. /pages/home.html?section=default
   * @param {string} method - a HTTP method, eg. GET, POST, etc
   * @return {object} the match response
   * @public
   */
  lookup(uri, method) {
    let getParams = {};
    let routePath = uri;
    let handler = undefined;
    if (uri.indexOf('?') > -1) {
      let tmp = url.parse(uri, true);
      routePath = tmp.pathname;
      getParams = tmp.query;
    }
    const routeLen = routePath.length;
    const noTrailingSlash = (routePath[routeLen - 1] === '/') ? routePath.substring(0, routeLen - 1) : routePath;
    let lookupRes = this.defaultResult;
    /* istanbul ignore else */
    if (noTrailingSlash.length > 0) {
      const routeParts = noTrailingSlash.substring(1).split('/');
      lookupRes = this.tree.lookup(routeParts, method);
      if (method in lookupRes.leaf.handlers) handler = lookupRes.leaf.handlers[method];
      else if ('ANY' in lookupRes.leaf.handlers) handler = lookupRes.leaf.handlers.ANY;
    }

    return {
      handler,
      params: {
        get: getParams,
        url: lookupRes.params
      },
      foundRoute: lookupRes.foundExact
    };
  }
}

module.exports = {
  Leaf,
  Branch
};