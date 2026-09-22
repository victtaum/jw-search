const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('web');
http.createServer((req,res)=>{
  const requested = new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root, '.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
    res.end(data);
  });
}).listen(8766,'127.0.0.1');
