var fs = require('fs');
var mime = require('mime').types;

module.exports = function(rootdir, disallow_updir, return404) {
	if (!return404) {
    return404 = function(res404) {
      res404.writeHead(404);
      res404.end();
    };
  }
	return function(res, url) {
		var filename = rootdir + url;
		if (disallow_updir && url.indexOf('..') != -1) return404(res);
    else if (url.lastIndexOf('.') != -1) {
      fs.readFile(filename, function(err, data) {
        if (err) return404(res);
        else {
          var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
          res.setHeader('content-type', mime[extension]);
          res.end(data);
          return true;
        }
      });
    }
    else {
    	if (filename[filename.length - 1] == '/') {
        var tryfile = false;
        filename += 'index.html';
      }
      else {
        filename += '/index.html';
        var tryfile = true;
      }
      fs.readFile(filename, function(err, data) {
        if (err) {
          if (tryfile) {
            filename = filename.substr(0, filename.length - 11) + '.html';
            fs.readFile(filename, function(err, data) {
              if (err) return404(res);
              else {
                var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
                res.setHeader('content-type', mime[extension]);
                res.end(data);
              }
            });
          }
          else return404(res);
        }
        else {
          var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
          res.setHeader('content-type', mime[extension]);
          res.end(data);
        }
      });
    }
	}
}