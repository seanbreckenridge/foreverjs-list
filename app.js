const forever = require('forever');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const _ = require('underscore');
const fs = require('fs');
const ansiparse = require('ansiparse');

/**
 * clean (remove some unnecessary attributes) the forever process object
 * @param {Object} obj A forever object from the forever.list command
 * @return {Object} A cleaned object
 */
function cleanForever(obj) {
  delete obj.spawnWith.env;
  delete obj.foreverPid;
  delete obj.socket;
  delete obj.cwd;
  delete obj.pidFile;
  delete obj.env;
  return obj;
}


// get information from environment variables
const port = process.env.FOREVER_LIST_PORT || 8084;
const password = process.env.FOREVER_LIST_TOKEN;
if (!process.env.FOREVER_LIST_TOKEN) {
  console.log('Could not find FOREVER_LIST_TOKEN environment variable.');
  process.exit(1);
}

const app = express();

// middleware
// logging
app.use(morgan('short'));
app.use(helmet());


// authenticate with token
app.use(function tokenAuth(req, res, next) {
  const token = req.header('token');
  if (!token || token !== password) {
    return res.status(403).send({error: 'Not authenticated'});
  }
  next();
});


app.get('/', function(req, res) {
  forever.list(false, function(err, processes) {
    // Could possibly throw errors at:
    // https://github.com/foreversd/forever/blob/58eb131b727b68da6403a31991244dd3d51663a3/lib/forever.js#L94
    if (err) {
      res.status(400).send(JSON.stringify(error));
    } else {
      res.status(200).send(JSON.stringify(
          processes.map(cleanForever),
      ));
    }
  });
});

app.get('/:id/logs', function(req, res) {
  forever.list(false, function(err, processes) {
    if (err) {
      res.status(400).send(JSON.stringify(error));
    } else {
      let process = _.find(processes, (o) => o.uid == req.params.id);
      if (!process) {
        res.status(404).send({error: `No such process id: ${req.params.id}`});
      } else {
        fs.readFile(process.logFile, function(err, data) {
          if (err) {
            res.status(400).send(JSON.stringify(err))
          } else {
            var d;
            d = (data || '').toString().trim();
            if (!d || d === '\n') {
              res.status(404).send({error: {filename: process.logFile, logs: 'Empty Log'}})
            } else {
              res.status(200).send({filename: process.logFile, logs: ansiparse(d)})
            }
          }
        });
      }
    }
  });
});

console.log(`Starting foreverjs-list server on port ${port}...`);
app.listen(port);
