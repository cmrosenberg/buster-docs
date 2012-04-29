var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");
var mime = require("mime");
var ejs = require("ejs");

var PUBLIC = path.join(__dirname, "public");
var SITE = path.join(__dirname, "site");

function serveFile(req, res, path) {
    fs.readFile(path, function (err, data) {
        res.writeHead(200, {"Content-Type": mime.lookup(path)});
        res.write(data);
        res.end();
    });
}

function serveTemplate(req, res, path, pathname) {
    var newLocation;
    if (pathname.slice(pathname.length - 1) == "/") {
        res.writeHead(200, {"Content-Type": "text/html"});
        fs.readFile(path, function (err, data) {
            res.write(renderTemplate(pathname, data.toString("utf8")));
        res.end();
        });
    } else {
        newLocation = pathname + "/";
        res.writeHead(301, {"Location": newLocation});
        console.log("301: " + pathname + " -> " + newLocation + " | Referer: " + req.headers.referer);
        res.end();
    }
}

function title(content) {
    var title;

    try {
        title = content.match(/<h1>(.*)<\/h1>/)[1] || "Buster.JS";
    } catch (e) {
        title = "Buster.JS";
    }

    return title.replace("<code>", "").replace("</code>", "");
}

function renderTemplate(pathname, content) {
    var layout = fs.readFileSync(path.join(__dirname, "layout.html"), "utf8");
    var menu = [
        {href: "/", text: "Home"},
        {href: "/docs/", text: "Documentation", matcher: /^\/docs/},
        {href: "/download/", text: "Download", matcher: /^\/download/},
        {href: "/community/", text: "Community"}
    ];

    menu.forEach(function (item) {
        var current = item.matcher ? item.matcher.test(pathname) : pathname == item.href;
        if (current) item.className = "active";
    });

    return ejs.render(layout.replace(/<title>Buster<\/title>/,
                                     "<title>" + title(content) + "</title>"),
                      {content: content, menu: menu});
}

function notFound(req, res) {
    res.writeHead(404);
    res.write("404 Page Not Found");
    console.log("404: " + req.url + " | Referer: " + req.headers.referer);
    res.end();
}

function tryFile(req, res, path, callback) {
    fs.stat(path, function (err, stat) {
        if (!err && stat.isFile()) {
            serveFile(req, res, path);
            callback();
        } else {
            callback(err || { message: path + " is not a file" });
        }
    });
}

function tryTemplate(req, res, path, urlPath, callback) {
    fs.stat(path, function (err, stat) {
        if (!err && stat.isFile()) {
            serveTemplate(req, res, path, urlPath);
            callback();
        } else {
            callback(err || { message: path + " is not a file" });
        }
    });
}

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url);

    tryFile(req, res, path.join(PUBLIC, u.pathname).replace(/[\/\\]$/, ".html"), function (err) {
        if (!err) { return; }

        tryFile(req, res, path.join(PUBLIC, u.pathname, "index.html"), function (err) {
            if (!err) { return; }

            tryTemplate(req, res, path.join(SITE, u.pathname).replace(/[\/\\]$/, "") + ".html", u.pathname, function (err) {
                if (!err) { return; }

                tryTemplate(req, res, path.join(SITE, u.pathname, "index.html"), u.pathname, function (err) {
                    if (!err) { return; }
                    notFound(req, res);
                });
            });
        });
    });
});

exports.start = function (port) {
    port = port || parseInt(process.argv[2], 10) || 8090;
    server.listen(port);
    console.log("Listening on http://127.0.0.1:" + port); 
    return server;
};
