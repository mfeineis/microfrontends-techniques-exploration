
Core.use(function (Y) {
    Y.log("loaded /about", Y);
    Y.on("app.initialized", function (data, unsubscribe) {
        Y.log("app.initialized:on", data);
        Y.request("jsconfig.json", function (err, response) {
            if (err) {
                Y.log.error("ERR", response);
                unsubscribe();
                return;
            }
            Y.log("jsconfig.json", JSON.parse(response.responseText));
            unsubscribe();
        });
    });
    Y.emit("app.initialized", { time: Date.now() });
});
