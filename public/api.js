; (function (factory) {
    // var ip = '192.168.193.4'
    var ip = '192.168.0.105'
    var baseURL = 'http://' + ip + ':8000'

    Object.defineProperty(factory, '__requestConfig', {
        value: Object.freeze({
            ip,
            baseURL
        }),
        enumerable: false,
        writable: false,
        configurable: false
    })
})(window)
