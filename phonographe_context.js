const globalContextMap = new Map();

var Context = function (serverId) {
    this._serverId = serverId;
    this._currentDispatcher = null;
}

Context.prototype.getServerId = function () {
    return this._serverId;
};

Context.prototype.getCurrentDispatcher = function () {
    return this._currentDispatcher;
};

Context.prototype.setCurrentDispatcher = function (currentDispatcher) {
    this._currentDispatcher = currentDispatcher;
};


module.exports = {
    getOrCreateNew: function (serverId) {
        if (globalContextMap[serverId] === undefined) {
            let ctx = new Context(serverId);
            globalContextMap[serverId] = ctx;

            return ctx;
        }

        return globalContextMap[serverId];
    },
    removeIfExists: function (serverId) {
        globalContextMap[serverId] = undefined;
    }
};
