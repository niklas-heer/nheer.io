---
title: Upload-Server via NodeJS
eyecatch: fa-code
description: "NodeJs Upload Server"
date: 2011-11-29
tags: [code, nodejs]
---

Ich hab hier mal einen Upload-Server geschrieben.

Er funktioniert (getestet unter Ubuntu-1104-natty-64-minimal) soweit.

Folgende Plugins werden verwendet: [formidable](https://github.com/felixge/node-formidable)

Folgendes ist unklar:

* funktionieren Mehrere Uploads gleichzeitig?
* Wie kann man ein Upload-Status-Balken einbinden?

Also starte ich hier einfach mal einen Aufruf!
Wer mit mir zusammen ein Projekt starten möchte (Git und SVN-Repo kann ich stellen) der möge sich bitte durch einen Kommentar hierzu melden!

Ansonsten unterliegt der Code hier der GNU/GPL 3!

``` javascript
// Code unterliegt der GNU/GPL 3
// Autor: Niklas Heer

require('../test/common');
var http = require('http'),
    util = require('util'),
    formidable = require('./formidable'),
    server;

server = http.createServer(function(req, res) {
  if (req.url == '/') {
    res.writeHead(200, {'content-type': 'text/html'});

          // HTML
          res.write(
              '&lt;style&gt;'+
                  '#progress_bar {'+
                'margin: 10px 0;'+
                'padding: 3px;'+
                'border: 1px solid #000;'+
                'font-size: 14px;'+
                'clear: both;'+
                'opacity: 0;'+
                '-moz-transition: opacity 1s linear;'+
                    '-o-transition: opacity 1s linear;'+
                    '-webkit-transition: opacity 1s linear;'+
                    '}'+
                    '#progress_bar.loading {'+
                    'opacity: 1.0;'+
                    '}'+
                    '#progress_bar .percent {'+
                    'background-color: #99ccff;'+
                    'height: auto;'+
                    'width: 0;'+
                    '}'+
                    '&lt;/style&gt;'
                    );

    res.end(
        '&lt;h1&gt; File Upload &lt;/h1&gt;'+
      '&lt;form action="/upload" enctype="multipart/form-data" method="post"&gt;'+
      '&lt;input type="text" name="title"&gt;&lt;br&gt;'+
      '&lt;input type="file" name="upload" multiple="multiple"&gt;&lt;br&gt;'+
      '&lt;input type="submit" value="Upload"&gt;'+
      '&lt;/form&gt;'
    );

  } else if (req.url == '/upload') {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];

    form.uploadDir = '/home/root/node/testing/TEST_TMP';
        form.keepExtensions = true;

    form

      .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
      })
      .on('progress', function(recieved, total) {
          var progress = parseInt((recieved / total) * 100);
          var mb =(total / 1024 / 1024).toFixed(1);

          // Printing to screen
          util.print("Uploading "+mb+"mb ("+progress+"%)\015");
      })

      .on('file', function(field, file) {
        console.log(field, file);
        files.push([field, file]);
      })
      .on('end', function() {
        console.log('-&gt; upload done');
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received fields:\n\n '+util.inspect(fields));
        res.write('\n\n');
        res.end('received files:\n\n '+util.inspect(files));
      });
    form.parse(req);
  } else {
    res.writeHead(404, {'content-type': 'text/plain'});
    res.end('404');
  }
});
server.listen(1337);

console.log('listening on http://we-host.de/');
```
