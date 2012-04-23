var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");
var mime = require("mime");
var ejs = require("ejs");

var PUBLIC = path.join(__dirname, "public");
var SITE = path.join(__dirname, "site");
var LAYOUT = fs.readFileSync(path.join(__dirname, "layout.html"), "utf8");

function serveFile(path, res) {
    fs.readFile(path, function (err, data) {
        res.writeHead(200, {"Content-Type": mime.lookup(path)});
        res.write(data);
        res.end();
    });
}

function serveTemplate(path, pathname, res) {
    if (pathname.slice(pathname.length - 1) == "/") {
        res.writeHead(200, {"Content-Type": "text/html"});
        fs.readFile(path, function (err, data) {
            res.write(renderTemplate(pathname, data.toString("utf8")));
        res.end();
        });
    } else {
        res.writeHead(301, {"Location": pathname + "/"});
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

    return ejs.render(LAYOUT.replace(/<title>Buster<\/title>/,
                                     "<title>" + title(content) + "</title>"),
                      {content: content, menu: menu});
}

function notFound(res) {
    res.writeHead(404);
    res.write("404 Page Not Found");
    res.end();
}

function tryFile(res, path, callback) {
    fs.stat(path, function (err, stat) {
        if (!err && stat.isFile()) {
            serveFile(path, res);
            callback();
        } else {
            callback(err || { message: path + " is not a file" });
        }
    });
}

function tryTemplate(res, path, urlPath, callback) {
    fs.stat(path, function (err, stat) {
        if (!err && stat.isFile()) {
            serveTemplate(path, urlPath, res);
            callback();
        } else {
            callback(err || { message: path + " is not a file" });
        }
    });
}

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url);

    tryFile(res, path.join(PUBLIC, u.pathname).replace(/[\/\\]$/, ".html"), function (err) {
        if (!err) { return; }

        tryFile(res, path.join(PUBLIC, u.pathname, "index.html"), function (err) {
            if (!err) { return; }

            tryTemplate(res, path.join(SITE, u.pathname).replace(/[\/\\]$/, ".html"), u.pathname, function (err) {
                if (!err) { return; }

                tryTemplate(res, path.join(SITE, u.pathname, "index.html"), u.pathname, function (err) {
                    if (!err) { return; }
                    notFound(res);
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
