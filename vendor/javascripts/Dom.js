/*
 HTTPRequest v0.1.5
 https://github.com/mbonano/HTTPRequest
 */

var HTTPRequest = {
    //Public
    AjaxStartCallback: null,
    AjaxStopCallback: null,
    processedCallback: null,
    newRequestCallback: null,
    defaultTag: 'untagged',
    setAjaxStart: function(callback)
    {
        this.AjaxStartCallback = callback;
    },
    setAjaxStop: function(callback)
    {
        this.AjaxStopCallback = callback;
    },
    setProcessedCallback: function(callback)
    {
        this.processedCallback = callback;
    },
    setnewRequestCallback: function(callback)
    {
        this.newRequestCallback = callback;
    },
    post: function (url, data, callback, options)
    {
        var parameters = {
            METHOD: 'POST',
            data: data
        };

        var request_parms = this._mergeobjs(options, parameters);

        return this.request(url, request_parms, callback, options);
    },
    put: function (url, data, callback, options)
    {
        var parameters = {
            METHOD: 'PUT',
            data: data
        };

        var request_parms = this._mergeobjs(options, parameters);

        return this.request(url, request_parms, callback, options);
    },
    get: function (url, callback, options)
    {
        var parameters = {
            METHOD: 'GET'
        };

        var request_parms = this._mergeobjs(options, parameters);

        return this.request(url, request_parms, callback);
    },
    del: function (url, callback, options)
    {
        var parameters = {
            METHOD: 'DELETE'
        };

        var request_parms = this._mergeobjs(options, parameters);

        return this.request(url, request_parms, callback);
    },
    request: function (url, parameters, callback)
    {
        parameters = this._key2lower(parameters);

        if (typeof parameters.method === 'undefined')
        {
            parameters.method = 'GET';
        }

        if (typeof parameters.requesttype === 'string') {
            parameters.requesttype = parameters.datatype.toLowerCase();

            // todo: add formdata?
            var valid_types = ['json', 'urlencoded'];

            if (valid_types.indexOf(parameters.requesttype) === -1)
            {
                throw ('Invalid requestType option');
            }
        }
        else {
            parameters.requesttype = 'urlencoded';
        }

        //Response content type
        if (typeof parameters.datatype === 'string')
        {
            parameters.datatype = parameters.datatype.toLowerCase();

            var valid_types = ['json'];

            if (valid_types.indexOf(parameters.datatype) === -1)
            {
                throw ('Invalid datatype option');
            }
        }
        else
        {
            parameters.datatype = null;
        }

        //data
        if (typeof parameters.data !== 'undefined')
        {
            parameters.data = parameters.requesttype === 'json' ? this._objToJsonString(parameters.data) : this._objToQuery(parameters.data);
        }

        if (typeof parameters.query !== 'undefined')
        {
            parameters.query = this._objToQuery(parameters.query);
            if (url.indexOf('?') !== -1)
            { //Has ?
                url += '&' + parameters.query;
            }
            else //add ?
            {
                url += '?' + parameters.query;
            }
        }

        //do XHR
        var xhr = this._getXHR();
        var newID = this._grabNewID();

        var currentTag = this.defaultTag;

        if (typeof parameters.tag == 'string')
        {
            currentTag = parameters.tag;
        }

        this._pendingXHRs[newID] = {
            xhr:xhr,
            tag: currentTag
        };

        if (typeof this._TAGS[currentTag] != 'object')
        {
            this._TAGS[currentTag] = {};
        }

        this._TAGS[currentTag][newID] = null;

        if (this.newRequestCallback != undefined)
        {
            this.newRequestCallback(currentTag, newID);
        }

        if (this._numKeys(this._pendingXHRs) == 1)
        {
            if (this.AjaxStartCallback != undefined)
            {
                this.AjaxStartCallback();
            }
        }

        this._processXHR(xhr, newID, parameters, url, callback);
        return newID;
    },
    stopID: function (id)
    {
        if (typeof this._pendingXHRs[id] == 'object')
        {
            if (this._pendingXHRs[id].xhr == null)
            {
                this._processdID(id);
            }
            else
            {
                this._abortedXHRs.push(this._pendingXHRs[id].xhr);
                this._pendingXHRs[id].xhr.abort();
            }
        }
    },
    stopAll: function()
    {
        for (var key in this._pendingXHRs)
        {
            if (this._pendingXHRs.hasOwnProperty(key))
            {
                this.stopID(key);
            }
        }
    },
    stopTag: function(tag)
    {
        if (typeof this._TAGS[tag] == 'object')
        {
            for (var key in this._TAGS[tag])
            {
                this.stopID(key);
            }
        }
    },
    encode: function (str)
    {
        // URL-encodes string
        //
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/urlencode
        // +   original by: Philip Peterson
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: AJ
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: travc
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Lars Fischer
        // +      input by: Ratheous
        // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Joris
        // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
        // %          note 1: This reflects PHP 5.3/6.0+ behavior
        // %        note 2: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
        // %        note 2: pages served as UTF-8
        // *     example 1: urlencode('Kevin van Zonneveld!');
        // *     returns 1: 'Kevin+van+Zonneveld%21'
        // *     example 2: urlencode('http://kevin.vanzonneveld.net/');
        // *     returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
        // *     example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
        // *     returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
        str = (str + '').toString();

        // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
        // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
            replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    decode: function (str)
    {
        // Decodes URL-encoded string
        //
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/urldecode
        // +   original by: Philip Peterson
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: AJ
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // +      input by: travc
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Lars Fischer
        // +      input by: Ratheous
        // +   improved by: Orlando
        // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
        // +      bugfixed by: Rob
        // +      input by: e-mike
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // %        note 1: info on what encoding functions to use from: http://xkr.us/articles/javascript/encode-compare/
        // %        note 2: Please be aware that this function expects to decode from UTF-8 encoded strings, as found on
        // %        note 2: pages served as UTF-8
        // *     example 1: urldecode('Kevin+van+Zonneveld%21');
        // *     returns 1: 'Kevin van Zonneveld!'
        // *     example 2: urldecode('http%3A%2F%2Fkevin.vanzonneveld.net%2F');
        // *     returns 2: 'http://kevin.vanzonneveld.net/'
        // *     example 3: urldecode('http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a');
        // *     returns 3: 'http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a'
        return decodeURIComponent((str + '').replace(/\+/g, '%20'));
    },
    //jQuery - some code ripped from jQuery, and modified to work standalone
    rvalidchars: /^[\],:{}\s]*$/,
    rvalidescape: /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens: /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rvalidbraces: /(?:^|:|,)(?:\s*\[)+/g,
    parseJSON: function (data)
    {
        try
        {
            if (typeof exports === 'object' && exports) //This is a module (Node), use native JSON parser
            {
                return JSON.parse(data);
            }
            else //web browser
            {
                if (typeof data !== "string" || !data)
                {
                    return null;
                }

                // Make sure leading/trailing whitespace is removed (IE can't handle it)
                data = this.trim(data);

                // Attempt to parse using the native JSON parser first
                if (window.JSON && window.JSON.parse)
                {
                    return window.JSON.parse(data);
                }

                // Make sure the incoming data is actual JSON
                // Logic borrowed from http://json.org/json2.js
                if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, "")))
                {
                    return (new Function("return " + data))();
                }
            }
        }
        catch (e)
        {
            return null;
        }
    },
    JSONStringify: function (data) {
        try {
            if (typeof exports === 'object' && exports) //This is a module (Node), use native JSON parser
            {
                return JSON.stringify(data);
            }
            else //web browser
            {
                // Attempt to stringify using the native JSON stringifier first
                if (window.JSON && window.JSON.stringify)
                {
                    return window.JSON.stringify(data);
                }

                // todo: steal an impl?
                return null;
            }
        }
        catch (e)
        {
            return null;
        }
    },
    base64encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = HTTPRequest._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                HTTPRequest._keyStr.charAt(enc1) + HTTPRequest._keyStr.charAt(enc2) +
                HTTPRequest._keyStr.charAt(enc3) + HTTPRequest._keyStr.charAt(enc4);

        }

        return output;
    },

    base64decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = HTTPRequest._keyStr.indexOf(input.charAt(i++));
            enc2 = HTTPRequest._keyStr.indexOf(input.charAt(i++));
            enc3 = HTTPRequest._keyStr.indexOf(input.charAt(i++));
            enc4 = HTTPRequest._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = HTTPRequest._utf8_decode(output);

        return output;

    },

    trim: function (str, charlist)
    {
        // http://kevin.vanzonneveld.net
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: mdsjack (http://www.mdsjack.bo.it)
        // +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
        // +      input by: Erkekjetter
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: DxGx
        // +   improved by: Steven Levithan (http://blog.stevenlevithan.com)
        // +    tweaked by: Jack
        // +   bugfixed by: Onno Marsman
        // *     example 1: trim('    Kevin van Zonneveld    ');
        // *     returns 1: 'Kevin van Zonneveld'
        // *     example 2: trim('Hello World', 'Hdle');
        // *     returns 2: 'o Wor'
        // *     example 3: trim(16, 1);
        // *     returns 3: 6
        var whitespace, l = 0,
            i = 0;
        str += '';

        if (!charlist)
        {
            // default list
            whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
        }
        else
        {
            // preg_quote custom list
            charlist += '';
            whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
        }

        l = str.length;
        for (i = 0; i < l; i++)
        {
            if (whitespace.indexOf(str.charAt(i)) === -1)
            {
                str = str.substring(i);
                break;
            }
        }

        l = str.length;
        for (i = l - 1; i >= 0; i--)
        {
            if (whitespace.indexOf(str.charAt(i)) === -1)
            {
                str = str.substring(0, i + 1);
                break;
            }
        }

        return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
    },
    //Private
    _pendingXHRs: {},
    _TAGS: {},
    _abortedXHRs: [],
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    _processdID: function(id)
    {
        var tag = this._pendingXHRs[id].tag;
        if (this.processedCallback != undefined)
        {
            this.processedCallback(tag, id);
        }

        delete this._TAGS[tag][id];

        if (this._TAGS[tag].length == 0)
        {
            delete this._TAGS[tag];
        }

        delete this._pendingXHRs[id];
    },
    _processXHR: function(xhr, id, parameters, url, callback)
    {
        if (xhr == null) //NO XHR :(
        {
            this._processdID(id);

            callback(0, {}, null); //return an error code zero
            this._stopAjaxLoader();
        }
        else
        {
            var self = this;
            xhr.onreadystatechange = function ()
            {
                if (xhr.readyState === 4) //HTTP results!
                {
                    if (self._abortedXHRs.indexOf(xhr) >= 0)
                    {
                        self._abortedXHRs.splice(self._abortedXHRs.indexOf(xhr), 1);
                    }
                    else
                    {
                        if (parameters.datatype === 'json') //json
                        {
                            callback(xhr.status, self._headersToHeaders(xhr.getAllResponseHeaders()), self.parseJSON(xhr.responseText));
                        }
                        else //other
                        {
                            callback(xhr.status, self._headersToHeaders(xhr.getAllResponseHeaders()), xhr.responseText);
                        }
                    }

                    self._processdID(id);
                    self._stopAjaxLoader();
                }
            };

            xhr.open(parameters.method, url, true);
            // is this really the best way to check for Node???
            if (typeof exports === 'object' && exports)
            {
                xhr.disableHeaderCheck(true); //Disable header check
                if (typeof parameters.useragent !== 'undefined')
                {
                    xhr.setRequestHeader('User-Agent', parameters.useragent);
                }

                // why is this only allowed in Node? :(
                if (typeof parameters.headers === 'object')
                {
                    for (var key in parameters.headers)
                    {
                        if (parameters.headers.hasOwnProperty(key))
                        {
                            xhr.setRequestHeader(key, parameters.headers[key]);
                        }
                    }
                }
            }

            if (parameters.method === 'POST' || parameters.method === 'PUT')
            {
                xhr.setRequestHeader("Content-Type", parameters.requesttype === 'json' ? "application/json" : "application/x-www-form-urlencoded");
            }

            if (typeof parameters.beforesend == 'function') {
                parameters.beforesend(xhr);
            }

            if (parameters.method === 'POST' || parameters.method === 'PUT')
            {
                if (typeof parameters.data !== 'undefined')
                {
                    xhr.send(parameters.data);
                }
                else
                {
                    xhr.send();
                }
            }
            else
            {
                xhr.send();
            }
        }
    },
    _lastID: 1,
    _grabNewID: function()
    {
        return this._lastID++;
    },
    _stopAjaxLoader: function()
    {
        if (this._numKeys(this._pendingXHRs) == 0)
        {
            if (this.AjaxStopCallback != undefined)
            {
                this.AjaxStopCallback();
            }
        }
    },
    _objToQuery: function (obj)
    {
        if (typeof obj === 'object')
        {
            var str = [];
            for (var key in obj)
            {
                if (obj.hasOwnProperty(key))
                {
                    str.push(this.encode(key) + '=' + this.encode(obj[key]));
                }
            }
            return str.join('&');
        }
        else
        {
            return obj;
        }
    },
    _objToJsonString: function (obj) {
        // there's no good way to tell if an object is already stringified
        if (typeof obj === 'string' && /^[[{]/.test(obj)) {
            return obj;
        } else {
            return this.JSONStringify(obj);
        }
    },
    _headersToHeaders: function (headers_str)
    {
        if (headers_str.indexOf('\n') !== -1)
        {
            var headers_list = headers_str.split('\n');

            var header_obj = {};
            for (var key in headers_list)
            {
                if (headers_list.hasOwnProperty(key))
                {
                    var header = headers_list[key].replace(/\r/g, '');

                    if (header.indexOf(':') !== -1)
                    {
                        var firstcharpos = this._firstcharpos(header, ':');

                        var field = header.substring(0, firstcharpos).toLowerCase();
                        var value = header.substring(firstcharpos);
                        value = value.substring(2);

                        header_obj[field] = value;
                    }
                }
            }
            return header_obj;
        }
        else
        {
            return {};
        }
    },
    _firstcharpos: function (string, c)
    {
        var letters = string.split('');
        for (var key in letters)
        {
            if (letters[key] === c)
            {
                return key;
            }
        }
        return null;
    },
    _numKeys: function(obj)
    {
        var count = 0;
        for(var prop in obj)
        {
            count++;
        }
        return count;
    },
    _getXHR: function ()
    {
        if (typeof exports === 'object' && exports) //This is a module, require XHR support.
        {
            XMLHttpRequest = require('./lib/XMLHttpRequest.js').XMLHttpRequest; //Using xmlhttprequest 1.4.0 https://github.com/driverdan/node-XMLHttpRequest
            return new XMLHttpRequest();
        }
        else //Thanks http://www.webmasterworld.com/javascript/4027629.htm
        {
            if (window.XMLHttpRequest)
            {
                // Chrome, Firefox, IE7+, Opera, Safari
                return new XMLHttpRequest();
            }
            // IE6
            try
            {
                // The latest stable version. It has the best security, performance,
                // reliability, and W3C conformance. Ships with Vista, and available
                // with other OS's via downloads and updates.
                return new ActiveXObject('MSXML2.XMLHTTP.6.0');
            }
            catch (e)
            {
                try
                {
                    // The fallback.
                    return new ActiveXObject('MSXML2.XMLHTTP.3.0');
                }
                catch (e) //This browser is not AJAX enabled.
                {
                    return null;
                }
            }
        }
    },
    _key2lower: function (obj)
    {
        if (typeof obj === 'object')
        {
            var newobj = {};
            for (var attrname in obj)
            {
                if (obj.hasOwnProperty(attrname))
                {
                    newobj[attrname.toLowerCase()] = obj[attrname];
                }
            }
            return newobj;
        }
        else
        {
            return {};
        }
    },
    _mergeobjs: function (obj1, obj2)
    {
        //Make sure they are objects!
        if (typeof obj1 !== 'object')
        {
            obj1 = {};
        }

        if (typeof obj2 !== 'object')
        {
            obj2 = {};
        }
        //Merge
        var obj3 = {};
        for (var attrname in obj1)
        {
            if (obj1.hasOwnProperty(attrname))
            {
                obj3[attrname] = obj1[attrname];
            }
        }

        for (var attrname2 in obj2)
        {
            if (obj2.hasOwnProperty(attrname2))
            {
                obj3[attrname2] = obj2[attrname2];
            }
        }
        return obj3;
    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }
        return string;
    }
};

// Make a Node module, if possible.
if (typeof exports === 'object' && exports)
{
    module.exports = HTTPRequest;
}

//Export as a AMD module
if (typeof define === 'function' && define.amd)
{
    define(HTTPRequest);
}

/*
Dom.coffee
https://github.com/vladh/Dom.coffee
 */
var Dom;

Dom = function(element) {
  return new Dom.prototype.init(element);
};

Dom.extend = Dom.prototype.extend = function() {
  var key, nrArgs, source, target, value;
  nrArgs = arguments.length;
  if (nrArgs === 1) {
    target = this;
    source = arguments[0];
  } else {
    target = arguments[0];
    source = arguments[1];
  }
  for (key in source) {
    value = source[key];
    target[key] = value;
  }
  return target;
};

Dom.prototype.init = function(element) {

  /*
  Takes either a DOM element or an array of DOM elements or NodeList a selector.
  @els is the list of elements for this instance.
  @elemData stores various data stored for elements (e.g. old display value).
   */
  var invalidArgumentMessage;
  invalidArgumentMessage = 'Dom.coffee: Invalid argument to .init(), must be one of: a DOM element, an array of DOM elements, a NodeList, a selector, `document` or `window`.';
  if (element == null) {
    throw new Error(invalidArgumentMessage);
  }
  if ((element.constructor != null) && element.constructor === Dom) {
    return element;
  }
  if (Dom.isNode(element) || element === window || element === document) {
    this.els = [element];
  } else if (element.constructor === Array && element.every(Dom.isNode)) {
    this.els = element;
  } else if (Dom.isNodeList(element)) {
    this.els = [].slice.call(element);
  } else if (Dom.isSelector(element)) {
    this.els = [].slice.apply(document.querySelectorAll(element));
  } else {
    throw new Error(invalidArgumentMessage);
  }
  return this;
};

Dom.prototype.init.prototype = Dom.prototype;

Dom.prototype.extend({
  map: function() {
    return this.els.map.apply(this.els, arguments);
  },
  reduce: function() {
    return this.els.reduce.apply(this.els, arguments);
  },
  filter: function() {
    return this.els.filter.apply(this.els, arguments);
  },
  imap: function() {
    var results;
    results = this.map.apply(this, arguments);
    if (results.length === 1) {
      return results[0];
    }
    return results;
  },
  elem: function() {
    return this.imap(function(x) {
      return x;
    });
  }
});

Dom.extend({
  elemData: {},
  getElemData: function(el, key) {
    if ((Dom.elemData[el] != null) && (Dom.elemData[el][key] != null)) {
      return Dom.elemData[el][key];
    } else {
      return null;
    }
  },
  setElemData: function(el, key, value) {
    var _base, _base1;
    (_base = Dom.elemData)[el] || (_base[el] = {});
    (_base1 = Dom.elemData[el])[key] || (_base1[key] = {});
    return Dom.elemData[el][key] = value;
  }
});

(function() {
  var isElement, isNode, isNodeList, isSelector;
  isNode = function(el) {
    if (typeof Node === 'object') {
      return el instanceof Node;
    } else {
      return el && typeof el === 'object' && typeof el.nodeType === 'number' && typeof el.nodeName === 'string';
    }
  };
  isNodeList = function(x) {

    /*
    From http://stackoverflow.com/q/7238177/3803222
     */
    var stringRepr;
    stringRepr = Object.prototype.toString.call(x);
    return typeof x === 'object' && /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) && x.hasOwnProperty('length') && (x.length === 0 || (typeof x[0] === "object" && x[0].nodeType > 0));
  };
  isElement = function(el) {
    if (typeof HTMLElement === 'object') {
      return el instanceof HTMLElement;
    } else {
      return el && typeof el === 'object' && el !== null && el.nodeType === 1 && typeof el.nodeName === 'string';
    }
  };
  isSelector = function(x) {

    /*
    This is a pretty naive check.
     */
    return typeof x === "string";
  };
  return Dom.extend({
    isNode: isNode,
    isNodeList: isNodeList,
    isElement: isElement,
    isSelector: isSelector
  });
})();

(function() {
  var append, appendTo, checked, clone, disable, empty, enable, getAttribute, getHTML, getValue, remove, removeAttribute, selectedOption, setAttribute, setHTML, setValue;
  empty = function(el) {
    return el.innerHTML = '';
  };
  setHTML = function(el, content) {
    return el.innerHTML = content;
  };
  getHTML = function(el, content) {
    return el.innerHTML;
  };
  append = function(el, content) {
    if (typeof content === 'string') {
      el.innerHTML || (el.innerHTML = '');
      return el.innerHTML += content;
    } else if (Dom.isNode(content)) {
      return el.appendChild(content);
    } else if (content instanceof Dom) {
      return content.map(function(appendee) {
        return el.appendChild(appendee);
      });
    } else {
      throw new Error('Dom.coffee: Invalid argument to .append(), must be either string, DOM element or Dom instance');
    }
  };
  appendTo = function(el, parent) {
    if (Dom.isNode(parent)) {
      return parent.appendChild(el);
    } else if (parent instanceof Dom) {
      return parent.map(function(appender) {
        return appender.appendChild(el);
      });
    } else {
      throw new Error('Dom.coffee: Invalid argument to .appendTo(), must be either DOM element or Dom instance');
    }
  };
  clone = function(el, deep) {
    return el.cloneNode(deep);
  };
  getAttribute = function(el, name) {
    return el.getAttribute(name);
  };
  setAttribute = function(el, name, value) {
    return el.setAttribute(name, value);
  };
  removeAttribute = function(el, name) {
    return el.removeAttribute(name);
  };
  disable = function(el) {
    return setAttribute(el, 'disabled', 'disabled');
  };
  enable = function(el) {
    return removeAttribute(el, 'disabled');
  };
  remove = function(el) {
    return el.parentNode.removeChild(el);
  };
  checked = function(el) {
    return el.checked;
  };
  selectedOption = function(el) {
    return el.options[el.selectedIndex];
  };
  setValue = function(el, value) {
    return el.value = value;
  };
  getValue = function(el) {
    if (el.tagName.toLowerCase() === 'input') {
      if (el.type.toLowerCase() === 'checkbox') {
        return el.checked;
      }
      return el.value;
    }
    if (el.tagName.toLowerCase() === 'textarea') {
      return el.value;
    }
    if (el.tagName.toLowerCase() === 'select') {
      return el.options[el.selectedIndex].value;
    }
    return el.value;
  };
  return Dom.prototype.extend({
    empty: function() {
      this.imap(empty);
      return this;
    },
    html: function(content) {
      if (content != null) {
        this.imap(function(el) {
          return setHTML(el, content);
        });
        return this;
      } else {
        return this.imap(function(el) {
          return getHTML(el);
        });
      }
    },
    append: function(content) {
      this.imap(function(el) {
        return append(el, content);
      });
      return this;
    },
    appendTo: function(parent) {
      this.imap(function(el) {
        return appendTo(el, parent);
      });
      return this;
    },
    clone: function(deep) {
      this.imap(function(el) {
        return clone(el, deep);
      });
      return this;
    },
    attr: function(name, value) {
      if (value != null) {
        this.imap(function(el) {
          return setAttribute(el, name, value);
        });
        return this;
      } else {
        return this.imap(function(el) {
          return getAttribute(el, name);
        });
      }
    },
    removeAttr: function(name) {
      this.imap(function(el) {
        return removeAttribute(el, name);
      });
      return this;
    },
    disable: function() {
      this.imap(disable);
      return this;
    },
    enable: function() {
      this.imap(enable);
      return this;
    },
    remove: function() {
      this.imap(remove);
      return this;
    },
    checked: function() {
      return this.imap(checked);
    },
    selectedOption: function() {
      return Dom(this.imap(selectedOption));
    },
    value: function(value) {
      if (value != null) {
        this.imap(function(el) {
          return setValue(el, value);
        });
        return this;
      } else {
        return this.imap(function(el) {
          return getValue(el);
        });
      }
    }
  });
})();

(function() {
  var addClass, containsClass, getStyle, hasClass, height, hide, isVisible, offset, pxToNumber, reNotWhitespace, removeClass, scrollTop, setStyle, show, spaceClass, toggle, toggleClass, trimClass, width;
  reNotWhitespace = /\S+/g;
  getStyle = function(el, name, forceGetComputed) {

    /*
    Falls back to using getComputedStyle if `el.style` doesn't have what we
    need. Perhaps consider optimising this.
     */
    if (!forceGetComputed && (el.style[name] != null) && el.style[name].length > 0) {
      return el.style[name];
    } else {
      return getComputedStyle(el).getPropertyValue(name);
    }
  };
  setStyle = function(el, name, value) {
    return el.style[name] = value;
  };
  hide = function(el) {
    var display;
    if (!isVisible(el)) {
      return;
    }
    display = getStyle(el, 'display');
    if (display !== 'none') {
      Dom.setElemData(el, 'oldDisplay', display);
    }
    return setStyle(el, 'display', 'none');
  };
  show = function(el) {
    var newDisplay;
    if (isVisible(el)) {
      return;
    }
    newDisplay = Dom.getElemData(el, 'oldDisplay') || Dom.getDefaultDisplay(el.tagName);
    return setStyle(el, 'display', newDisplay);
  };
  isVisible = function(el) {
    return getStyle(el, 'display') !== 'none';
  };
  toggle = function(el) {
    if (isVisible(el)) {
      return hide(el);
    } else {
      return show(el);
    }
  };
  trimClass = function(cls) {
    return cls.replace(/[\t\r\n\f]/g, ' ');
  };
  spaceClass = function(cls) {
    if (cls) {
      return ' ' + trimClass(cls) + ' ';
    } else {
      return ' ';
    }
  };
  containsClass = function(parent, child) {
    return spaceClass(parent).indexOf(spaceClass(child)) !== -1;
  };
  hasClass = function(el, cls) {
    return containsClass(el.className, cls);
  };
  removeClass = function(el, strClasses) {
    var classes;
    classes = strClasses.match(reNotWhitespace) || [];
    if (classes.length === 0) {
      return;
    }
    return classes.map(function(cls) {
      var newClassName;
      if (!hasClass(el, cls)) {
        return;
      }
      newClassName = el.className;
      while (containsClass(newClassName, cls)) {
        newClassName = spaceClass(newClassName).replace(spaceClass(cls), ' ');
      }
      return el.className = newClassName.trim();
    });
  };
  addClass = function(el, strClasses) {
    var classes;
    classes = strClasses.match(reNotWhitespace) || [];
    if (classes.length === 0) {
      return;
    }
    return classes.map(function(cls) {
      var newClassName;
      if (hasClass(el, cls)) {
        return;
      }
      newClassName = spaceClass(el.className) + cls + ' ';
      return el.className = newClassName.trim();
    });
  };
  toggleClass = function(el, strClasses) {
    var classes;
    classes = strClasses.match(reNotWhitespace) || [];
    if (classes.length === 0) {
      return;
    }
    return classes.map(function(cls) {
      if (hasClass(el, cls)) {
        return removeClass(el, cls);
      } else {
        return addClass(el, cls);
      }
    });
  };
  offset = function(el) {
    var box;
    box = el.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    };
  };
  pxToNumber = function(px) {
    return +(px.replace('px', ''));
  };
  height = function(el) {
    var computedHeight, styleHeight;
    if (el === window) {
      return window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || document.body.clientHeight;
    } else {
      styleHeight = pxToNumber(getStyle(el, 'height'));
      if (isNaN(styleHeight)) {
        computedHeight = pxToNumber(getStyle(el, 'height', true));
        return computedHeight;
      } else {
        return styleHeight;
      }
    }
  };
  width = function(el) {
    var computedWidth, styleWidth;
    if (el === window) {
      return window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || document.body.clientWidth;
    } else {
      styleWidth = pxToNumber(getStyle(el, 'width'));
      if (isNaN(styleWidth)) {
        computedWidth = pxToNumber(getStyle(el, 'width', true));
        return computedWidth;
      } else {
        return styleWidth;
      }
    }
  };
  Dom.prototype.extend({
    style: function(name, value) {
      if (value != null) {
        this.imap(function(el) {
          return setStyle(el, name, value);
        });
        return this;
      } else {
        return this.imap(function(el) {
          return getStyle(el, name);
        });
      }
    },
    height: function() {
      return this.imap(height);
    },
    width: function() {
      return this.imap(width);
    },
    show: function() {
      this.imap(show);
      return this;
    },
    hide: function() {
      this.imap(hide);
      return this;
    },
    isVisible: function() {
      return this.imap(isVisible);
    },
    toggle: function() {
      this.imap(toggle);
      return this;
    },
    addClass: function(cls) {
      this.imap(function(el) {
        return addClass(el, cls);
      });
      return this;
    },
    removeClass: function(cls) {
      this.imap(function(el) {
        return removeClass(el, cls);
      });
      return this;
    },
    toggleClass: function(cls) {
      this.imap(function(el) {
        return toggleClass(el, cls);
      });
      return this;
    },
    hasClass: function(cls) {
      return this.imap(function(el) {
        return hasClass(el, cls);
      });
    },
    offset: function() {
      return this.imap(offset);
    }
  });
  scrollTop = function() {
    return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
  };
  return Dom.extend({
    scrollTop: scrollTop
  });
})();

(function() {
  var bind, loaded;
  bind = function(el, type, handler) {
    if (el.addEventListener) {
      return el.addEventListener(type, handler, false);
    } else if (el.attachEvent) {
      return el.attachEvent('on' + type, handler);
    } else {
      return el['on' + type] = handler;
    }
  };
  Dom.prototype.extend({
    bind: function(type, handler) {
      this.imap(function(el) {
        return bind(el, type, handler);
      });
      return this;
    }
  });
  loaded = function(done) {
    return bind(document, 'DOMContentLoaded', done);
  };
  return Dom.extend({
    loaded: loaded
  });
})();

(function() {
  var closestParent, find, matches, parent, thisOrClosestParent;
  matches = (function() {

    /*
    From:
      https://github.com/desandro/matches-selector
      matchesSelector v1.0.3
      MIT license
     */
    var div, ensureHasParent, getMatchesMethod, match, matchChild, matchesMethod, matchesSelector, qsaFallback, supportsOrphans;
    ensureHasParent = function(elem) {
      var fragment;
      if (elem.parentNode) {
        return;
      }
      fragment = document.createDocumentFragment();
      return fragment.appendChild(elem);
    };
    qsaFallback = function(elem, selector) {
      var elems, i, _i, _ref;
      ensureHasParent(elem);
      elems = elem.parentNode.querySelectorAll(selector);
      for (i = _i = 0, _ref = elems.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (elems[i] === elem) {
          return true;
        }
      }
      return false;
    };
    matchChild = function(elem, selector) {
      ensureHasParent(elem);
      return match(elem, selector);
    };
    getMatchesMethod = function() {
      var i, method, prefix, prefixes, _i, _ref;
      if (Element.prototype.matches) {
        return 'matches';
      }
      if (Element.prototype.matchesSelector) {
        return 'matchesSelector';
      }
      prefixes = ['webkit', 'moz', 'ms', 'o'];
      for (i = _i = 0, _ref = prefixes.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        prefix = prefixes[i];
        method = prefix + 'MatchesSelector';
        if (Element.prototype[method]) {
          return method;
        }
      }
    };
    matchesMethod = getMatchesMethod();
    match = function(elem, selector) {
      return elem[matchesMethod](selector);
    };
    matchesSelector = null;
    if (matchesMethod) {
      div = document.createElement('div');
      supportsOrphans = match(div, 'div');
      matchesSelector = supportsOrphans ? match : matchChild;
    } else {
      matchesSelector = qsaFallback;
    }
    return matchesSelector;
  })();
  parent = function(el) {
    return Dom(el.parentNode);
  };
  thisOrClosestParent = function(el, selector) {
    if (el.nodeType === 1 && matches(el, selector)) {
      return Dom(el);
    }
    return closestParent(el, selector);
  };
  closestParent = function(el, selector) {
    if (el.nodeType === 9) {
      return;
    }
    el = el.parentNode;
    while (el && el.nodeType !== 9) {
      if (el.nodeType === 1 && matches(el, selector)) {
        return Dom(el);
      }
      el = el.parentNode;
    }
    return null;
  };
  find = function(el, selector) {
    return [].slice.call(el.querySelectorAll(selector));
  };
  return Dom.prototype.extend({
    matches: function(selector) {
      return this.imap(function(el) {
        return matches(el, selector);
      });
    },
    parent: function() {
      return this.imap(parent);
    },
    thisOrClosestParent: function(selector) {
      return this.imap(function(el) {
        return thisOrClosestParent(el, selector);
      });
    },
    closestParent: function(selector) {
      return this.imap(function(el) {
        return closestParent(el, selector);
      });
    },
    find: function(selector) {
      var elGroups, els;
      elGroups = this.map(function(el) {
        return find(el, selector);
      });
      els = elGroups.reduce((function(acc, group) {
        return acc.concat(group);
      }), []);
      return Dom(els);
    },
    found: function() {
      return this.els.length > 0;
    }
  });
})();

(function() {
  var getDefaultDisplay;
  getDefaultDisplay = function(nodeName) {

    /*
    If we don't already know the default display, try making an element with
    that nodeName and getting its display.
     */
    var display, el;
    if (Dom.defaultDisplays[nodeName] != null) {
      return Dom.defaultDisplays[nodeName];
    }
    el = Dom(document.createElement(nodeName));
    el.appendTo(document.body);
    display = el.style('display');
    Dom.defaultDisplays[nodeName] = display;
    el.remove();
    display || (display = 'block');

    /*
    Apparently the createElement method may fail, and we would have to read
    the value from inside an iframe. Maybe account for this at some point.
     */
    return display;
  };
  return Dom.extend({
    defaultDisplays: {
      HTML: 'block',
      BODY: 'block'
    },
    getDefaultDisplay: getDefaultDisplay
  });
})();

(function() {
  var del, delJSON, get, getJSON, post, postJSON, put, putJSON;
  post = function(url, data, done, options) {
    options || (options = {});
    return HTTPRequest.post(url, data, (function(status, headers, content) {
      if (options.json) {
        content = JSON.parse(content);
      }
      return done(status, content, headers);
    }), options);
  };
  postJSON = function(url, data, done, options) {
    options || (options = {});
    options.json = true;
    return post(url, data, done, options);
  };
  put = function(url, data, done, options) {
    options || (options = {});
    return HTTPRequest.put(url, data, (function(status, headers, content) {
      if (options.json) {
        content = JSON.parse(content);
      }
      return done(status, content, headers);
    }), options);
  };
  putJSON = function(url, data, done, options) {
    options || (options = {});
    options.json = true;
    return put(url, data, done, options);
  };
  get = function(url, done, options) {
    options || (options = {});
    return HTTPRequest.get(url, (function(status, headers, content) {
      if (options.json) {
        content = JSON.parse(content);
      }
      return done(status, content, headers);
    }), options);
  };
  getJSON = function(url, done, options) {
    options || (options = {});
    options.json = true;
    return get(url, done, options);
  };
  del = function(url, done, options) {
    options || (options = {});
    return HTTPRequest.del(url, (function(status, headers, content) {
      if (options.json) {
        content = JSON.parse(content);
      }
      return done(status, content, headers);
    }), options);
  };
  delJSON = function(url, done, options) {
    options || (options = {});
    options.json = true;
    return del(url, done, options);
  };
  return Dom.extend({
    post: post,
    postJSON: postJSON,
    put: put,
    putJSON: putJSON,
    get: get,
    getJSON: getJSON,
    del: del,
    delJSON: delJSON
  });
})();
