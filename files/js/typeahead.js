/*!
 * typeahead.js 0.9.3
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */

(function($) {
ttvar VERSION = "0.9.3";
ttvar utils = {
ttttisMsie: function() {
ttttttvar match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
ttttttreturn match ? parseInt(match[2], 10) : false;
tttt},
ttttisBlankString: function(str) {
ttttttreturn !str || /^\s*$/.test(str);
tttt},
ttttescapeRegExChars: function(str) {
ttttttreturn str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
tttt},
ttttisString: function(obj) {
ttttttreturn typeof obj === "string";
tttt},
ttttisNumber: function(obj) {
ttttttreturn typeof obj === "number";
tttt},
ttttisArray: $.isArray,
ttttisFunction: $.isFunction,
ttttisObject: $.isPlainObject,
ttttisUndefined: function(obj) {
ttttttreturn typeof obj === "undefined";
tttt},
ttttbind: $.proxy,
ttttbindAll: function(obj) {
ttttttvar val;
ttttttfor (var key in obj) {
tttttttt$.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj));
tttttt}
tttt},
ttttindexOf: function(haystack, needle) {
ttttttfor (var i = 0; i < haystack.length; i++) {
ttttttttif (haystack[i] === needle) {
ttttttttttreturn i;
tttttttt}
tttttt}
ttttttreturn -1;
tttt},
tttteach: $.each,
ttttmap: $.map,
ttttfilter: $.grep,
ttttevery: function(obj, test) {
ttttttvar result = true;
ttttttif (!obj) {
ttttttttreturn result;
tttttt}
tttttt$.each(obj, function(key, val) {
ttttttttif (!(result = test.call(null, val, key, obj))) {
ttttttttttreturn false;
tttttttt}
tttttt});
ttttttreturn !!result;
tttt},
ttttsome: function(obj, test) {
ttttttvar result = false;
ttttttif (!obj) {
ttttttttreturn result;
tttttt}
tttttt$.each(obj, function(key, val) {
ttttttttif (result = test.call(null, val, key, obj)) {
ttttttttttreturn false;
tttttttt}
tttttt});
ttttttreturn !!result;
tttt},
ttttmixin: $.extend,
ttttgetUniqueId: function() {
ttttttvar counter = 0;
ttttttreturn function() {
ttttttttreturn counter++;
tttttt};
tttt}(),
ttttdefer: function(fn) {
ttttttsetTimeout(fn, 0);
tttt},
ttttdebounce: function(func, wait, immediate) {
ttttttvar timeout, result;
ttttttreturn function() {
ttttttttvar context = this, args = arguments, later, callNow;
ttttttttlater = function() {
tttttttttttimeout = null;
ttttttttttif (!immediate) {
ttttttttttttresult = func.apply(context, args);
tttttttttt}
tttttttt};
ttttttttcallNow = immediate && !timeout;
ttttttttclearTimeout(timeout);
tttttttttimeout = setTimeout(later, wait);
ttttttttif (callNow) {
ttttttttttresult = func.apply(context, args);
tttttttt}
ttttttttreturn result;
tttttt};
tttt},
ttttthrottle: function(func, wait) {
ttttttvar context, args, timeout, result, previous, later;
ttttttprevious = 0;
ttttttlater = function() {
ttttttttprevious = new Date();
tttttttttimeout = null;
ttttttttresult = func.apply(context, args);
tttttt};
ttttttreturn function() {
ttttttttvar now = new Date(), remaining = wait - (now - previous);
ttttttttcontext = this;
ttttttttargs = arguments;
ttttttttif (remaining <= 0) {
ttttttttttclearTimeout(timeout);
tttttttttttimeout = null;
ttttttttttprevious = now;
ttttttttttresult = func.apply(context, args);
tttttttt} else if (!timeout) {
tttttttttttimeout = setTimeout(later, remaining);
tttttttt}
ttttttttreturn result;
tttttt};
tttt},
tttttokenizeQuery: function(str) {
ttttttreturn $.trim(str).toLowerCase().split(/[\s]+/);
tttt},
tttttokenizeText: function(str) {
ttttttreturn $.trim(str).toLowerCase().split(/[\s\-_]+/);
tttt},
ttttgetProtocol: function() {
ttttttreturn location.protocol;
tttt},
ttttnoop: function() {}
tt};
ttvar EventTarget = function() {
ttttvar eventSplitter = /\s+/;
ttttreturn {
tttttton: function(events, callback) {
ttttttttvar event;
ttttttttif (!callback) {
ttttttttttreturn this;
tttttttt}
ttttttttthis._callbacks = this._callbacks || {};
ttttttttevents = events.split(eventSplitter);
ttttttttwhile (event = events.shift()) {
ttttttttttthis._callbacks[event] = this._callbacks[event] || [];
ttttttttttthis._callbacks[event].push(callback);
tttttttt}
ttttttttreturn this;
tttttt},
tttttttrigger: function(events, data) {
ttttttttvar event, callbacks;
ttttttttif (!this._callbacks) {
ttttttttttreturn this;
tttttttt}
ttttttttevents = events.split(eventSplitter);
ttttttttwhile (event = events.shift()) {
ttttttttttif (callbacks = this._callbacks[event]) {
ttttttttttttfor (var i = 0; i < callbacks.length; i += 1) {
ttttttttttttttcallbacks[i].call(this, {
tttttttttttttttttype: event,
ttttttttttttttttdata: data
tttttttttttttt});
tttttttttttt}
tttttttttt}
tttttttt}
ttttttttreturn this;
tttttt}
tttt};
tt}();
ttvar EventBus = function() {
ttttvar namespace = "typeahead:";
ttttfunction EventBus(o) {
ttttttif (!o || !o.el) {
tttttttt$.error("EventBus initialized without el");
tttttt}
ttttttthis.$el = $(o.el);
tttt}
ttttutils.mixin(EventBus.prototype, {
tttttttrigger: function(type) {
ttttttttvar args = [].slice.call(arguments, 1);
ttttttttthis.$el.trigger(namespace + type, args);
tttttt}
tttt});
ttttreturn EventBus;
tt}();
ttvar PersistentStorage = function() {
ttttvar ls, methods;
tttttry {
ttttttls = window.localStorage;
ttttttls.setItem("~~~", "!");
ttttttls.removeItem("~~~");
tttt} catch (err) {
ttttttls = null;
tttt}
ttttfunction PersistentStorage(namespace) {
ttttttthis.prefix = [ "__", namespace, "__" ].join("");
ttttttthis.ttlKey = "__ttl__";
ttttttthis.keyMatcher = new RegExp("^" + this.prefix);
tttt}
ttttif (ls && window.JSON) {
ttttttmethods = {
tttttttt_prefix: function(key) {
ttttttttttreturn this.prefix + key;
tttttttt},
tttttttt_ttlKey: function(key) {
ttttttttttreturn this._prefix(key) + this.ttlKey;
tttttttt},
ttttttttget: function(key) {
ttttttttttif (this.isExpired(key)) {
ttttttttttttthis.remove(key);
tttttttttt}
ttttttttttreturn decode(ls.getItem(this._prefix(key)));
tttttttt},
ttttttttset: function(key, val, ttl) {
ttttttttttif (utils.isNumber(ttl)) {
ttttttttttttls.setItem(this._ttlKey(key), encode(now() + ttl));
tttttttttt} else {
ttttttttttttls.removeItem(this._ttlKey(key));
tttttttttt}
ttttttttttreturn ls.setItem(this._prefix(key), encode(val));
tttttttt},
ttttttttremove: function(key) {
ttttttttttls.removeItem(this._ttlKey(key));
ttttttttttls.removeItem(this._prefix(key));
ttttttttttreturn this;
tttttttt},
ttttttttclear: function() {
ttttttttttvar i, key, keys = [], len = ls.length;
ttttttttttfor (i = 0; i < len; i++) {
ttttttttttttif ((key = ls.key(i)).match(this.keyMatcher)) {
ttttttttttttttkeys.push(key.replace(this.keyMatcher, ""));
tttttttttttt}
tttttttttt}
ttttttttttfor (i = keys.length; i--; ) {
ttttttttttttthis.remove(keys[i]);
tttttttttt}
ttttttttttreturn this;
tttttttt},
ttttttttisExpired: function(key) {
ttttttttttvar ttl = decode(ls.getItem(this._ttlKey(key)));
ttttttttttreturn utils.isNumber(ttl) && now() > ttl ? true : false;
tttttttt}
tttttt};
tttt} else {
ttttttmethods = {
ttttttttget: utils.noop,
ttttttttset: utils.noop,
ttttttttremove: utils.noop,
ttttttttclear: utils.noop,
ttttttttisExpired: utils.noop
tttttt};
tttt}
ttttutils.mixin(PersistentStorage.prototype, methods);
ttttreturn PersistentStorage;
ttttfunction now() {
ttttttreturn new Date().getTime();
tttt}
ttttfunction encode(val) {
ttttttreturn JSON.stringify(utils.isUndefined(val) ? null : val);
tttt}
ttttfunction decode(val) {
ttttttreturn JSON.parse(val);
tttt}
tt}();
ttvar RequestCache = function() {
ttttfunction RequestCache(o) {
ttttttutils.bindAll(this);
tttttto = o || {};
ttttttthis.sizeLimit = o.sizeLimit || 10;
ttttttthis.cache = {};
ttttttthis.cachedKeysByAge = [];
tttt}
ttttutils.mixin(RequestCache.prototype, {
ttttttget: function(url) {
ttttttttreturn this.cache[url];
tttttt},
ttttttset: function(url, resp) {
ttttttttvar requestToEvict;
ttttttttif (this.cachedKeysByAge.length === this.sizeLimit) {
ttttttttttrequestToEvict = this.cachedKeysByAge.shift();
ttttttttttdelete this.cache[requestToEvict];
tttttttt}
ttttttttthis.cache[url] = resp;
ttttttttthis.cachedKeysByAge.push(url);
tttttt}
tttt});
ttttreturn RequestCache;
tt}();
ttvar Transport = function() {
ttttvar pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests, requestCache;
ttttfunction Transport(o) {
ttttttutils.bindAll(this);
tttttto = utils.isString(o) ? {
tttttttturl: o
tttttt} : o;
ttttttrequestCache = requestCache || new RequestCache();
ttttttmaxPendingRequests = utils.isNumber(o.maxParallelRequests) ? o.maxParallelRequests : maxPendingRequests || 6;
ttttttthis.url = o.url;
ttttttthis.wildcard = o.wildcard || "%QUERY";
ttttttthis.filter = o.filter;
ttttttthis.replace = o.replace;
ttttttthis.ajaxSettings = {
tttttttttype: "get",
ttttttttcache: o.cache,
tttttttttimeout: o.timeout,
ttttttttdataType: o.dataType || "json",
ttttttttbeforeSend: o.beforeSend
tttttt};
ttttttthis._get = (/^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce)(this._get, o.rateLimitWait || 300);
tttt}
ttttutils.mixin(Transport.prototype, {
tttttt_get: function(url, cb) {
ttttttttvar that = this;
ttttttttif (belowPendingRequestsThreshold()) {
ttttttttttthis._sendRequest(url).done(done);
tttttttt} else {
ttttttttttthis.onDeckRequestArgs = [].slice.call(arguments, 0);
tttttttt}
ttttttttfunction done(resp) {
ttttttttttvar data = that.filter ? that.filter(resp) : resp;
ttttttttttcb && cb(data);
ttttttttttrequestCache.set(url, resp);
tttttttt}
tttttt},
tttttt_sendRequest: function(url) {
ttttttttvar that = this, jqXhr = pendingRequests[url];
ttttttttif (!jqXhr) {
ttttttttttincrementPendingRequests();
ttttttttttjqXhr = pendingRequests[url] = $.ajax(url, this.ajaxSettings).always(always);
tttttttt}
ttttttttreturn jqXhr;
ttttttttfunction always() {
ttttttttttdecrementPendingRequests();
ttttttttttpendingRequests[url] = null;
ttttttttttif (that.onDeckRequestArgs) {
ttttttttttttthat._get.apply(that, that.onDeckRequestArgs);
ttttttttttttthat.onDeckRequestArgs = null;
tttttttttt}
tttttttt}
tttttt},
ttttttget: function(query, cb) {
ttttttttvar that = this, encodedQuery = encodeURIComponent(query || ""), url, resp;
ttttttttcb = cb || utils.noop;
tttttttturl = this.replace ? this.replace(this.url, encodedQuery) : this.url.replace(this.wildcard, encodedQuery);
ttttttttif (resp = requestCache.get(url)) {
ttttttttttutils.defer(function() {
ttttttttttttcb(that.filter ? that.filter(resp) : resp);
tttttttttt});
tttttttt} else {
ttttttttttthis._get(url, cb);
tttttttt}
ttttttttreturn !!resp;
tttttt}
tttt});
ttttreturn Transport;
ttttfunction incrementPendingRequests() {
ttttttpendingRequestsCount++;
tttt}
ttttfunction decrementPendingRequests() {
ttttttpendingRequestsCount--;
tttt}
ttttfunction belowPendingRequestsThreshold() {
ttttttreturn pendingRequestsCount < maxPendingRequests;
tttt}
tt}();
ttvar Dataset = function() {
ttttvar keys = {
ttttttthumbprint: "thumbprint",
ttttttprotocol: "protocol",
ttttttitemHash: "itemHash",
ttttttadjacencyList: "adjacencyList"
tttt};
ttttfunction Dataset(o) {
ttttttutils.bindAll(this);
ttttttif (utils.isString(o.template) && !o.engine) {
tttttttt$.error("no template engine specified");
tttttt}
ttttttif (!o.local && !o.prefetch && !o.remote) {
tttttttt$.error("one of local, prefetch, or remote is required");
tttttt}
ttttttthis.name = o.name || utils.getUniqueId();
ttttttthis.limit = o.limit || 5;
ttttttthis.minLength = o.minLength || 1;
ttttttthis.header = o.header;
ttttttthis.footer = o.footer;
ttttttthis.valueKey = o.valueKey || "value";
ttttttthis.template = compileTemplate(o.template, o.engine, this.valueKey);
ttttttthis.local = o.local;
ttttttthis.prefetch = o.prefetch;
ttttttthis.remote = o.remote;
ttttttthis.itemHash = {};
ttttttthis.adjacencyList = {};
ttttttthis.storage = o.name ? new PersistentStorage(o.name) : null;
tttt}
ttttutils.mixin(Dataset.prototype, {
tttttt_processLocalData: function(data) {
ttttttttthis._mergeProcessedData(this._processData(data));
tttttt},
tttttt_loadPrefetchData: function(o) {
ttttttttvar that = this, thumbprint = VERSION + (o.thumbprint || ""), storedThumbprint, storedProtocol, storedItemHash, storedAdjacencyList, isExpired, deferred;
ttttttttif (this.storage) {
ttttttttttstoredThumbprint = this.storage.get(keys.thumbprint);
ttttttttttstoredProtocol = this.storage.get(keys.protocol);
ttttttttttstoredItemHash = this.storage.get(keys.itemHash);
ttttttttttstoredAdjacencyList = this.storage.get(keys.adjacencyList);
tttttttt}
ttttttttisExpired = storedThumbprint !== thumbprint || storedProtocol !== utils.getProtocol();
tttttttto = utils.isString(o) ? {
tttttttttturl: o
tttttttt} : o;
tttttttto.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1e3;
ttttttttif (storedItemHash && storedAdjacencyList && !isExpired) {
ttttttttttthis._mergeProcessedData({
ttttttttttttitemHash: storedItemHash,
ttttttttttttadjacencyList: storedAdjacencyList
tttttttttt});
ttttttttttdeferred = $.Deferred().resolve();
tttttttt} else {
ttttttttttdeferred = $.getJSON(o.url).done(processPrefetchData);
tttttttt}
ttttttttreturn deferred;
ttttttttfunction processPrefetchData(data) {
ttttttttttvar filteredData = o.filter ? o.filter(data) : data, processedData = that._processData(filteredData), itemHash = processedData.itemHash, adjacencyList = processedData.adjacencyList;
ttttttttttif (that.storage) {
ttttttttttttthat.storage.set(keys.itemHash, itemHash, o.ttl);
ttttttttttttthat.storage.set(keys.adjacencyList, adjacencyList, o.ttl);
ttttttttttttthat.storage.set(keys.thumbprint, thumbprint, o.ttl);
ttttttttttttthat.storage.set(keys.protocol, utils.getProtocol(), o.ttl);
tttttttttt}
ttttttttttthat._mergeProcessedData(processedData);
tttttttt}
tttttt},
tttttt_transformDatum: function(datum) {
ttttttttvar value = utils.isString(datum) ? datum : datum[this.valueKey], tokens = datum.tokens || utils.tokenizeText(value), item = {
ttttttttttvalue: value,
tttttttttttokens: tokens
tttttttt};
ttttttttif (utils.isString(datum)) {
ttttttttttitem.datum = {};
ttttttttttitem.datum[this.valueKey] = datum;
tttttttt} else {
ttttttttttitem.datum = datum;
tttttttt}
ttttttttitem.tokens = utils.filter(item.tokens, function(token) {
ttttttttttreturn !utils.isBlankString(token);
tttttttt});
ttttttttitem.tokens = utils.map(item.tokens, function(token) {
ttttttttttreturn token.toLowerCase();
tttttttt});
ttttttttreturn item;
tttttt},
tttttt_processData: function(data) {
ttttttttvar that = this, itemHash = {}, adjacencyList = {};
ttttttttutils.each(data, function(i, datum) {
ttttttttttvar item = that._transformDatum(datum), id = utils.getUniqueId(item.value);
ttttttttttitemHash[id] = item;
ttttttttttutils.each(item.tokens, function(i, token) {
ttttttttttttvar character = token.charAt(0), adjacency = adjacencyList[character] || (adjacencyList[character] = [ id ]);
tttttttttttt!~utils.indexOf(adjacency, id) && adjacency.push(id);
tttttttttt});
tttttttt});
ttttttttreturn {
ttttttttttitemHash: itemHash,
ttttttttttadjacencyList: adjacencyList
tttttttt};
tttttt},
tttttt_mergeProcessedData: function(processedData) {
ttttttttvar that = this;
ttttttttutils.mixin(this.itemHash, processedData.itemHash);
ttttttttutils.each(processedData.adjacencyList, function(character, adjacency) {
ttttttttttvar masterAdjacency = that.adjacencyList[character];
ttttttttttthat.adjacencyList[character] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency;
tttttttt});
tttttt},
tttttt_getLocalSuggestions: function(terms) {
ttttttttvar that = this, firstChars = [], lists = [], shortestList, suggestions = [];
ttttttttutils.each(terms, function(i, term) {
ttttttttttvar firstChar = term.charAt(0);
tttttttttt!~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar);
tttttttt});
ttttttttutils.each(firstChars, function(i, firstChar) {
ttttttttttvar list = that.adjacencyList[firstChar];
ttttttttttif (!list) {
ttttttttttttreturn false;
tttttttttt}
ttttttttttlists.push(list);
ttttttttttif (!shortestList || list.length < shortestList.length) {
ttttttttttttshortestList = list;
tttttttttt}
tttttttt});
ttttttttif (lists.length < firstChars.length) {
ttttttttttreturn [];
tttttttt}
ttttttttutils.each(shortestList, function(i, id) {
ttttttttttvar item = that.itemHash[id], isCandidate, isMatch;
ttttttttttisCandidate = utils.every(lists, function(list) {
ttttttttttttreturn ~utils.indexOf(list, id);
tttttttttt});
ttttttttttisMatch = isCandidate && utils.every(terms, function(term) {
ttttttttttttreturn utils.some(item.tokens, function(token) {
ttttttttttttttreturn token.indexOf(term) === 0;
tttttttttttt});
tttttttttt});
ttttttttttisMatch && suggestions.push(item);
tttttttt});
ttttttttreturn suggestions;
tttttt},
ttttttinitialize: function() {
ttttttttvar deferred;
ttttttttthis.local && this._processLocalData(this.local);
ttttttttthis.transport = this.remote ? new Transport(this.remote) : null;
ttttttttdeferred = this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
ttttttttthis.local = this.prefetch = this.remote = null;
ttttttttthis.initialize = function() {
ttttttttttreturn deferred;
tttttttt};
ttttttttreturn deferred;
tttttt},
ttttttgetSuggestions: function(query, cb) {
ttttttttvar that = this, terms, suggestions, cacheHit = false;
ttttttttif (query.length < this.minLength) {
ttttttttttreturn;
tttttttt}
ttttttttterms = utils.tokenizeQuery(query);
ttttttttsuggestions = this._getLocalSuggestions(terms).slice(0, this.limit);
ttttttttif (suggestions.length < this.limit && this.transport) {
ttttttttttcacheHit = this.transport.get(query, processRemoteData);
tttttttt}
tttttttt!cacheHit && cb && cb(suggestions);
ttttttttfunction processRemoteData(data) {
ttttttttttsuggestions = suggestions.slice(0);
ttttttttttutils.each(data, function(i, datum) {
ttttttttttttvar item = that._transformDatum(datum), isDuplicate;
ttttttttttttisDuplicate = utils.some(suggestions, function(suggestion) {
ttttttttttttttreturn item.value === suggestion.value;
tttttttttttt});
tttttttttttt!isDuplicate && suggestions.push(item);
ttttttttttttreturn suggestions.length < that.limit;
tttttttttt});
ttttttttttcb && cb(suggestions);
tttttttt}
tttttt}
tttt});
ttttreturn Dataset;
ttttfunction compileTemplate(template, engine, valueKey) {
ttttttvar renderFn, compiledTemplate;
ttttttif (utils.isFunction(template)) {
ttttttttrenderFn = template;
tttttt} else if (utils.isString(template)) {
ttttttttcompiledTemplate = engine.compile(template);
ttttttttrenderFn = utils.bind(compiledTemplate.render, compiledTemplate);
tttttt} else {
ttttttttrenderFn = function(context) {
ttttttttttreturn "<p>" + context[valueKey] + "</p>";
tttttttt};
tttttt}
ttttttreturn renderFn;
tttt}
tt}();
ttvar InputView = function() {
ttttfunction InputView(o) {
ttttttvar that = this;
ttttttutils.bindAll(this);
ttttttthis.specialKeyCodeMap = {
tttttttt9: "tab",
tttttttt27: "esc",
tttttttt37: "left",
tttttttt39: "right",
tttttttt13: "enter",
tttttttt38: "up",
tttttttt40: "down"
tttttt};
ttttttthis.$hint = $(o.hint);
ttttttthis.$input = $(o.input).on("blur.tt", this._handleBlur).on("focus.tt", this._handleFocus).on("keydown.tt", this._handleSpecialKeyEvent);
ttttttif (!utils.isMsie()) {
ttttttttthis.$input.on("input.tt", this._compareQueryToInputValue);
tttttt} else {
ttttttttthis.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
ttttttttttif (that.specialKeyCodeMap[$e.which || $e.keyCode]) {
ttttttttttttreturn;
tttttttttt}
ttttttttttutils.defer(that._compareQueryToInputValue);
tttttttt});
tttttt}
ttttttthis.query = this.$input.val();
ttttttthis.$overflowHelper = buildOverflowHelper(this.$input);
tttt}
ttttutils.mixin(InputView.prototype, EventTarget, {
tttttt_handleFocus: function() {
ttttttttthis.trigger("focused");
tttttt},
tttttt_handleBlur: function() {
ttttttttthis.trigger("blured");
tttttt},
tttttt_handleSpecialKeyEvent: function($e) {
ttttttttvar keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
ttttttttkeyName && this.trigger(keyName + "Keyed", $e);
tttttt},
tttttt_compareQueryToInputValue: function() {
ttttttttvar inputValue = this.getInputValue(), isSameQuery = compareQueries(this.query, inputValue), isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
ttttttttif (isSameQueryExceptWhitespace) {
ttttttttttthis.trigger("whitespaceChanged", {
ttttttttttttvalue: this.query
tttttttttt});
tttttttt} else if (!isSameQuery) {
ttttttttttthis.trigger("queryChanged", {
ttttttttttttvalue: this.query = inputValue
tttttttttt});
tttttttt}
tttttt},
ttttttdestroy: function() {
ttttttttthis.$hint.off(".tt");
ttttttttthis.$input.off(".tt");
ttttttttthis.$hint = this.$input = this.$overflowHelper = null;
tttttt},
ttttttfocus: function() {
ttttttttthis.$input.focus();
tttttt},
ttttttblur: function() {
ttttttttthis.$input.blur();
tttttt},
ttttttgetQuery: function() {
ttttttttreturn this.query;
tttttt},
ttttttsetQuery: function(query) {
ttttttttthis.query = query;
tttttt},
ttttttgetInputValue: function() {
ttttttttreturn this.$input.val();
tttttt},
ttttttsetInputValue: function(value, silent) {
ttttttttthis.$input.val(value);
tttttttt!silent && this._compareQueryToInputValue();
tttttt},
ttttttgetHintValue: function() {
ttttttttreturn this.$hint.val();
tttttt},
ttttttsetHintValue: function(value) {
ttttttttthis.$hint.val(value);
tttttt},
ttttttgetLanguageDirection: function() {
ttttttttreturn (this.$input.css("direction") || "ltr").toLowerCase();
tttttt},
ttttttisOverflow: function() {
ttttttttthis.$overflowHelper.text(this.getInputValue());
ttttttttreturn this.$overflowHelper.width() > this.$input.width();
tttttt},
ttttttisCursorAtEnd: function() {
ttttttttvar valueLength = this.$input.val().length, selectionStart = this.$input[0].selectionStart, range;
ttttttttif (utils.isNumber(selectionStart)) {
ttttttttttreturn selectionStart === valueLength;
tttttttt} else if (document.selection) {
ttttttttttrange = document.selection.createRange();
ttttttttttrange.moveStart("character", -valueLength);
ttttttttttreturn valueLength === range.text.length;
tttttttt}
ttttttttreturn true;
tttttt}
tttt});
ttttreturn InputView;
ttttfunction buildOverflowHelper($input) {
ttttttreturn $("<span></span>").css({
ttttttttposition: "absolute",
ttttttttleft: "-9999px",
ttttttttvisibility: "hidden",
ttttttttwhiteSpace: "nowrap",
ttttttttfontFamily: $input.css("font-family"),
ttttttttfontSize: $input.css("font-size"),
ttttttttfontStyle: $input.css("font-style"),
ttttttttfontVariant: $input.css("font-variant"),
ttttttttfontWeight: $input.css("font-weight"),
ttttttttwordSpacing: $input.css("word-spacing"),
ttttttttletterSpacing: $input.css("letter-spacing"),
tttttttttextIndent: $input.css("text-indent"),
tttttttttextRendering: $input.css("text-rendering"),
tttttttttextTransform: $input.css("text-transform")
tttttt}).insertAfter($input);
tttt}
ttttfunction compareQueries(a, b) {
tttttta = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
ttttttb = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
ttttttreturn a === b;
tttt}
tt}();
ttvar DropdownView = function() {
ttttvar html = {
ttttttsuggestionsList: '<span class="tt-suggestions"></span>'
tttt}, css = {
ttttttsuggestionsList: {
ttttttttdisplay: "block"
tttttt},
ttttttsuggestion: {
ttttttttwhiteSpace: "nowrap",
ttttttttcursor: "pointer"
tttttt},
ttttttsuggestionChild: {
ttttttttwhiteSpace: "normal"
tttttt}
tttt};
ttttfunction DropdownView(o) {
ttttttutils.bindAll(this);
ttttttthis.isOpen = false;
ttttttthis.isEmpty = true;
ttttttthis.isMouseOverDropdown = false;
ttttttthis.$menu = $(o.menu).on("mouseenter.tt", this._handleMouseenter).on("mouseleave.tt", this._handleMouseleave).on("click.tt", ".tt-suggestion", this._handleSelection).on("mouseover.tt", ".tt-suggestion", this._handleMouseover);
tttt}
ttttutils.mixin(DropdownView.prototype, EventTarget, {
tttttt_handleMouseenter: function() {
ttttttttthis.isMouseOverDropdown = true;
tttttt},
tttttt_handleMouseleave: function() {
ttttttttthis.isMouseOverDropdown = false;
tttttt},
tttttt_handleMouseover: function($e) {
ttttttttvar $suggestion = $($e.currentTarget);
ttttttttthis._getSuggestions().removeClass("tt-is-under-cursor");
tttttttt$suggestion.addClass("tt-is-under-cursor");
tttttt},
tttttt_handleSelection: function($e) {
ttttttttvar $suggestion = $($e.currentTarget);
ttttttttthis.trigger("suggestionSelected", extractSuggestion($suggestion));
tttttt},
tttttt_show: function() {
ttttttttthis.$menu.css("display", "block");
tttttt},
tttttt_hide: function() {
ttttttttthis.$menu.hide();
tttttt},
tttttt_moveCursor: function(increment) {
ttttttttvar $suggestions, $cur, nextIndex, $underCursor;
ttttttttif (!this.isVisible()) {
ttttttttttreturn;
tttttttt}
tttttttt$suggestions = this._getSuggestions();
tttttttt$cur = $suggestions.filter(".tt-is-under-cursor");
tttttttt$cur.removeClass("tt-is-under-cursor");
ttttttttnextIndex = $suggestions.index($cur) + increment;
ttttttttnextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
ttttttttif (nextIndex === -1) {
ttttttttttthis.trigger("cursorRemoved");
ttttttttttreturn;
tttttttt} else if (nextIndex < -1) {
ttttttttttnextIndex = $suggestions.length - 1;
tttttttt}
tttttttt$underCursor = $suggestions.eq(nextIndex).addClass("tt-is-under-cursor");
ttttttttthis._ensureVisibility($underCursor);
ttttttttthis.trigger("cursorMoved", extractSuggestion($underCursor));
tttttt},
tttttt_getSuggestions: function() {
ttttttttreturn this.$menu.find(".tt-suggestions > .tt-suggestion");
tttttt},
tttttt_ensureVisibility: function($el) {
ttttttttvar menuHeight = this.$menu.height() + parseInt(this.$menu.css("paddingTop"), 10) + parseInt(this.$menu.css("paddingBottom"), 10), menuScrollTop = this.$menu.scrollTop(), elTop = $el.position().top, elBottom = elTop + $el.outerHeight(true);
ttttttttif (elTop < 0) {
ttttttttttthis.$menu.scrollTop(menuScrollTop + elTop);
tttttttt} else if (menuHeight < elBottom) {
ttttttttttthis.$menu.scrollTop(menuScrollTop + (elBottom - menuHeight));
tttttttt}
tttttt},
ttttttdestroy: function() {
ttttttttthis.$menu.off(".tt");
ttttttttthis.$menu = null;
tttttt},
ttttttisVisible: function() {
ttttttttreturn this.isOpen && !this.isEmpty;
tttttt},
ttttttcloseUnlessMouseIsOverDropdown: function() {
ttttttttif (!this.isMouseOverDropdown) {
ttttttttttthis.close();
tttttttt}
tttttt},
ttttttclose: function() {
ttttttttif (this.isOpen) {
ttttttttttthis.isOpen = false;
ttttttttttthis.isMouseOverDropdown = false;
ttttttttttthis._hide();
ttttttttttthis.$menu.find(".tt-suggestions > .tt-suggestion").removeClass("tt-is-under-cursor");
ttttttttttthis.trigger("closed");
tttttttt}
tttttt},
ttttttopen: function() {
ttttttttif (!this.isOpen) {
ttttttttttthis.isOpen = true;
tttttttttt!this.isEmpty && this._show();
ttttttttttthis.trigger("opened");
tttttttt}
tttttt},
ttttttsetLanguageDirection: function(dir) {
ttttttttvar ltrCss = {
ttttttttttleft: "0",
ttttttttttright: "auto"
tttttttt}, rtlCss = {
ttttttttttleft: "auto",
ttttttttttright: " 0"
tttttttt};
ttttttttdir === "ltr" ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss);
tttttt},
ttttttmoveCursorUp: function() {
ttttttttthis._moveCursor(-1);
tttttt},
ttttttmoveCursorDown: function() {
ttttttttthis._moveCursor(+1);
tttttt},
ttttttgetSuggestionUnderCursor: function() {
ttttttttvar $suggestion = this._getSuggestions().filter(".tt-is-under-cursor").first();
ttttttttreturn $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
tttttt},
ttttttgetFirstSuggestion: function() {
ttttttttvar $suggestion = this._getSuggestions().first();
ttttttttreturn $suggestion.length > 0 ? extractSuggestion($suggestion) : null;
tttttt},
ttttttrenderSuggestions: function(dataset, suggestions) {
ttttttttvar datasetClassName = "tt-dataset-" + dataset.name, wrapper = '<div class="tt-suggestion">%body</div>', compiledHtml, $suggestionsList, $dataset = this.$menu.find("." + datasetClassName), elBuilder, fragment, $el;
ttttttttif ($dataset.length === 0) {
tttttttttt$suggestionsList = $(html.suggestionsList).css(css.suggestionsList);
tttttttttt$dataset = $("<div></div>").addClass(datasetClassName).append(dataset.header).append($suggestionsList).append(dataset.footer).appendTo(this.$menu);
tttttttt}
ttttttttif (suggestions.length > 0) {
ttttttttttthis.isEmpty = false;
ttttttttttthis.isOpen && this._show();
ttttttttttelBuilder = document.createElement("div");
ttttttttttfragment = document.createDocumentFragment();
ttttttttttutils.each(suggestions, function(i, suggestion) {
ttttttttttttsuggestion.dataset = dataset.name;
ttttttttttttcompiledHtml = dataset.template(suggestion.datum);
ttttttttttttelBuilder.innerHTML = wrapper.replace("%body", compiledHtml);
tttttttttttt$el = $(elBuilder.firstChild).css(css.suggestion).data("suggestion", suggestion);
tttttttttttt$el.children().each(function() {
tttttttttttttt$(this).css(css.suggestionChild);
tttttttttttt});
ttttttttttttfragment.appendChild($el[0]);
tttttttttt});
tttttttttt$dataset.show().find(".tt-suggestions").html(fragment);
tttttttt} else {
ttttttttttthis.clearSuggestions(dataset.name);
tttttttt}
ttttttttthis.trigger("suggestionsRendered");
tttttt},
ttttttclearSuggestions: function(datasetName) {
ttttttttvar $datasets = datasetName ? this.$menu.find(".tt-dataset-" + datasetName) : this.$menu.find('[class^="tt-dataset-"]'), $suggestions = $datasets.find(".tt-suggestions");
tttttttt$datasets.hide();
tttttttt$suggestions.empty();
ttttttttif (this._getSuggestions().length === 0) {
ttttttttttthis.isEmpty = true;
ttttttttttthis._hide();
tttttttt}
tttttt}
tttt});
ttttreturn DropdownView;
ttttfunction extractSuggestion($el) {
ttttttreturn $el.data("suggestion");
tttt}
tt}();
ttvar TypeaheadView = function() {
ttttvar html = {
ttttttwrapper: '<span class="twitter-typeahead"></span>',
tttttthint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
ttttttdropdown: '<span class="tt-dropdown-menu"></span>'
tttt}, css = {
ttttttwrapper: {
ttttttttposition: "relative",
ttttttttdisplay: "inline-block"
tttttt},
tttttthint: {
ttttttttposition: "absolute",
tttttttttop: "0",
ttttttttleft: "0",
ttttttttborderColor: "transparent",
ttttttttboxShadow: "none"
tttttt},
ttttttquery: {
ttttttttposition: "relative",
ttttttttverticalAlign: "top",
ttttttttbackgroundColor: "transparent"
tttttt},
ttttttdropdown: {
ttttttttposition: "absolute",
tttttttttop: "100%",
ttttttttleft: "0",
ttttttttzIndex: "100",
ttttttttdisplay: "none"
tttttt}
tttt};
ttttif (utils.isMsie()) {
ttttttutils.mixin(css.query, {
ttttttttbackgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
tttttt});
tttt}
ttttif (utils.isMsie() && utils.isMsie() <= 7) {
ttttttutils.mixin(css.wrapper, {
ttttttttdisplay: "inline",
ttttttttzoom: "1"
tttttt});
ttttttutils.mixin(css.query, {
ttttttttmarginTop: "-1px"
tttttt});
tttt}
ttttfunction TypeaheadView(o) {
ttttttvar $menu, $input, $hint;
ttttttutils.bindAll(this);
ttttttthis.$node = buildDomStructure(o.input);
ttttttthis.datasets = o.datasets;
ttttttthis.dir = null;
ttttttthis.eventBus = o.eventBus;
tttttt$menu = this.$node.find(".tt-dropdown-menu");
tttttt$input = this.$node.find(".tt-query");
tttttt$hint = this.$node.find(".tt-hint");
ttttttthis.dropdownView = new DropdownView({
ttttttttmenu: $menu
tttttt}).on("suggestionSelected", this._handleSelection).on("cursorMoved", this._clearHint).on("cursorMoved", this._setInputValueToSuggestionUnderCursor).on("cursorRemoved", this._setInputValueToQuery).on("cursorRemoved", this._updateHint).on("suggestionsRendered", this._updateHint).on("opened", this._updateHint).on("closed", this._clearHint).on("opened closed", this._propagateEvent);
ttttttthis.inputView = new InputView({
ttttttttinput: $input,
tttttttthint: $hint
tttttt}).on("focused", this._openDropdown).on("blured", this._closeDropdown).on("blured", this._setInputValueToQuery).on("enterKeyed tabKeyed", this._handleSelection).on("queryChanged", this._clearHint).on("queryChanged", this._clearSuggestions).on("queryChanged", this._getSuggestions).on("whitespaceChanged", this._updateHint).on("queryChanged whitespaceChanged", this._openDropdown).on("queryChanged whitespaceChanged", this._setLanguageDirection).on("escKeyed", this._closeDropdown).on("escKeyed", this._setInputValueToQuery).on("tabKeyed upKeyed downKeyed", this._managePreventDefault).on("upKeyed downKeyed", this._moveDropdownCursor).on("upKeyed downKeyed", this._openDropdown).on("tabKeyed leftKeyed rightKeyed", this._autocomplete);
tttt}
ttttutils.mixin(TypeaheadView.prototype, EventTarget, {
tttttt_managePreventDefault: function(e) {
ttttttttvar $e = e.data, hint, inputValue, preventDefault = false;
ttttttttswitch (e.type) {
tttttttttcase "tabKeyed":
tttttttttthint = this.inputView.getHintValue();
ttttttttttinputValue = this.inputView.getInputValue();
ttttttttttpreventDefault = hint && hint !== inputValue;
ttttttttttbreak;

tttttttttcase "upKeyed":
tttttttttcase "downKeyed":
ttttttttttpreventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
ttttttttttbreak;
tttttttt}
ttttttttpreventDefault && $e.preventDefault();
tttttt},
tttttt_setLanguageDirection: function() {
ttttttttvar dir = this.inputView.getLanguageDirection();
ttttttttif (dir !== this.dir) {
ttttttttttthis.dir = dir;
ttttttttttthis.$node.css("direction", dir);
ttttttttttthis.dropdownView.setLanguageDirection(dir);
tttttttt}
tttttt},
tttttt_updateHint: function() {
ttttttttvar suggestion = this.dropdownView.getFirstSuggestion(), hint = suggestion ? suggestion.value : null, dropdownIsVisible = this.dropdownView.isVisible(), inputHasOverflow = this.inputView.isOverflow(), inputValue, query, escapedQuery, beginsWithQuery, match;
ttttttttif (hint && dropdownIsVisible && !inputHasOverflow) {
ttttttttttinputValue = this.inputView.getInputValue();
ttttttttttquery = inputValue.replace(/\s{2,}/g, " ").replace(/^\s+/g, "");
ttttttttttescapedQuery = utils.escapeRegExChars(query);
ttttttttttbeginsWithQuery = new RegExp("^(?:" + escapedQuery + ")(.*$)", "i");
ttttttttttmatch = beginsWithQuery.exec(hint);
ttttttttttthis.inputView.setHintValue(inputValue + (match ? match[1] : ""));
tttttttt}
tttttt},
tttttt_clearHint: function() {
ttttttttthis.inputView.setHintValue("");
tttttt},
tttttt_clearSuggestions: function() {
ttttttttthis.dropdownView.clearSuggestions();
tttttt},
tttttt_setInputValueToQuery: function() {
ttttttttthis.inputView.setInputValue(this.inputView.getQuery());
tttttt},
tttttt_setInputValueToSuggestionUnderCursor: function(e) {
ttttttttvar suggestion = e.data;
ttttttttthis.inputView.setInputValue(suggestion.value, true);
tttttt},
tttttt_openDropdown: function() {
ttttttttthis.dropdownView.open();
tttttt},
tttttt_closeDropdown: function(e) {
ttttttttthis.dropdownView[e.type === "blured" ? "closeUnlessMouseIsOverDropdown" : "close"]();
tttttt},
tttttt_moveDropdownCursor: function(e) {
ttttttttvar $e = e.data;
ttttttttif (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
ttttttttttthis.dropdownView[e.type === "upKeyed" ? "moveCursorUp" : "moveCursorDown"]();
tttttttt}
tttttt},
tttttt_handleSelection: function(e) {
ttttttttvar byClick = e.type === "suggestionSelected", suggestion = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
ttttttttif (suggestion) {
ttttttttttthis.inputView.setInputValue(suggestion.value);
ttttttttttbyClick ? this.inputView.focus() : e.data.preventDefault();
ttttttttttbyClick && utils.isMsie() ? utils.defer(this.dropdownView.close) : this.dropdownView.close();
ttttttttttthis.eventBus.trigger("selected", suggestion.datum, suggestion.dataset);
tttttttt}
tttttt},
tttttt_getSuggestions: function() {
ttttttttvar that = this, query = this.inputView.getQuery();
ttttttttif (utils.isBlankString(query)) {
ttttttttttreturn;
tttttttt}
ttttttttutils.each(this.datasets, function(i, dataset) {
ttttttttttdataset.getSuggestions(query, function(suggestions) {
ttttttttttttif (query === that.inputView.getQuery()) {
ttttttttttttttthat.dropdownView.renderSuggestions(dataset, suggestions);
tttttttttttt}
tttttttttt});
tttttttt});
tttttt},
tttttt_autocomplete: function(e) {
ttttttttvar isCursorAtEnd, ignoreEvent, query, hint, suggestion;
ttttttttif (e.type === "rightKeyed" || e.type === "leftKeyed") {
ttttttttttisCursorAtEnd = this.inputView.isCursorAtEnd();
ttttttttttignoreEvent = this.inputView.getLanguageDirection() === "ltr" ? e.type === "leftKeyed" : e.type === "rightKeyed";
ttttttttttif (!isCursorAtEnd || ignoreEvent) {
ttttttttttttreturn;
tttttttttt}
tttttttt}
ttttttttquery = this.inputView.getQuery();
tttttttthint = this.inputView.getHintValue();
ttttttttif (hint !== "" && query !== hint) {
ttttttttttsuggestion = this.dropdownView.getFirstSuggestion();
ttttttttttthis.inputView.setInputValue(suggestion.value);
ttttttttttthis.eventBus.trigger("autocompleted", suggestion.datum, suggestion.dataset);
tttttttt}
tttttt},
tttttt_propagateEvent: function(e) {
ttttttttthis.eventBus.trigger(e.type);
tttttt},
ttttttdestroy: function() {
ttttttttthis.inputView.destroy();
ttttttttthis.dropdownView.destroy();
ttttttttdestroyDomStructure(this.$node);
ttttttttthis.$node = null;
tttttt},
ttttttsetQuery: function(query) {
ttttttttthis.inputView.setQuery(query);
ttttttttthis.inputView.setInputValue(query);
ttttttttthis._clearHint();
ttttttttthis._clearSuggestions();
ttttttttthis._getSuggestions();
tttttt}
tttt});
ttttreturn TypeaheadView;
ttttfunction buildDomStructure(input) {
ttttttvar $wrapper = $(html.wrapper), $dropdown = $(html.dropdown), $input = $(input), $hint = $(html.hint);
tttttt$wrapper = $wrapper.css(css.wrapper);
tttttt$dropdown = $dropdown.css(css.dropdown);
tttttt$hint.css(css.hint).css({
ttttttttbackgroundAttachment: $input.css("background-attachment"),
ttttttttbackgroundClip: $input.css("background-clip"),
ttttttttbackgroundColor: $input.css("background-color"),
ttttttttbackgroundImage: $input.css("background-image"),
ttttttttbackgroundOrigin: $input.css("background-origin"),
ttttttttbackgroundPosition: $input.css("background-position"),
ttttttttbackgroundRepeat: $input.css("background-repeat"),
ttttttttbackgroundSize: $input.css("background-size")
tttttt});
tttttt$input.data("ttAttrs", {
ttttttttdir: $input.attr("dir"),
ttttttttautocomplete: $input.attr("autocomplete"),
ttttttttspellcheck: $input.attr("spellcheck"),
ttttttttstyle: $input.attr("style")
tttttt});
tttttt$input.addClass("tt-query").attr({
ttttttttautocomplete: "off",
ttttttttspellcheck: false
tttttt}).css(css.query);
tttttttry {
tttttttt!$input.attr("dir") && $input.attr("dir", "auto");
tttttt} catch (e) {}
ttttttreturn $input.wrap($wrapper).parent().prepend($hint).append($dropdown);
tttt}
ttttfunction destroyDomStructure($node) {
ttttttvar $input = $node.find(".tt-query");
ttttttutils.each($input.data("ttAttrs"), function(key, val) {
ttttttttutils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
tttttt});
tttttt$input.detach().removeData("ttAttrs").removeClass("tt-query").insertAfter($node);
tttttt$node.remove();
tttt}
tt}();
tt(function() {
ttttvar cache = {}, viewKey = "ttView", methods;
ttttmethods = {
ttttttinitialize: function(datasetDefs) {
ttttttttvar datasets;
ttttttttdatasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [ datasetDefs ];
ttttttttif (datasetDefs.length === 0) {
tttttttttt$.error("no datasets provided");
tttttttt}
ttttttttdatasets = utils.map(datasetDefs, function(o) {
ttttttttttvar dataset = cache[o.name] ? cache[o.name] : new Dataset(o);
ttttttttttif (o.name) {
ttttttttttttcache[o.name] = dataset;
tttttttttt}
ttttttttttreturn dataset;
tttttttt});
ttttttttreturn this.each(initialize);
ttttttttfunction initialize() {
ttttttttttvar $input = $(this), deferreds, eventBus = new EventBus({
ttttttttttttel: $input
tttttttttt});
ttttttttttdeferreds = utils.map(datasets, function(dataset) {
ttttttttttttreturn dataset.initialize();
tttttttttt});
tttttttttt$input.data(viewKey, new TypeaheadView({
ttttttttttttinput: $input,
tttttttttttteventBus: eventBus = new EventBus({
ttttttttttttttel: $input
tttttttttttt}),
ttttttttttttdatasets: datasets
tttttttttt}));
tttttttttt$.when.apply($, deferreds).always(function() {
ttttttttttttutils.defer(function() {
tttttttttttttteventBus.trigger("initialized");
tttttttttttt});
tttttttttt});
tttttttt}
tttttt},
ttttttdestroy: function() {
ttttttttreturn this.each(destroy);
ttttttttfunction destroy() {
ttttttttttvar $this = $(this), view = $this.data(viewKey);
ttttttttttif (view) {
ttttttttttttview.destroy();
tttttttttttt$this.removeData(viewKey);
tttttttttt}
tttttttt}
tttttt},
ttttttsetQuery: function(query) {
ttttttttreturn this.each(setQuery);
ttttttttfunction setQuery() {
ttttttttttvar view = $(this).data(viewKey);
ttttttttttview && view.setQuery(query);
tttttttt}
tttttt}
tttt};
ttttjQuery.fn.typeahead = function(method) {
ttttttif (methods[method]) {
ttttttttreturn methods[method].apply(this, [].slice.call(arguments, 1));
tttttt} else {
ttttttttreturn methods.initialize.apply(this, arguments);
tttttt}
tttt};
tt})();
})(window.jQuery);
