# foreverjs-list

An express server that serves information about [`forever.js`](https://github.com/foreversd/forever) processes

Uses a secret token to authenticate requests, exposes the `forever.js` `list` command output as JSON.

# Install

```shell
git clone https://gitlab.com/seanbreckenridge/foreverjs-list
cd foreverjs-list
npm install
# set required token somewhere (put in some environment file (e.g. ~/.bashrc))
export FOREVER_LIST_TOKEN=v1E074hIiW0WJ2vv3G1S
# you may set the FOREVER_LIST_PORT to change the default port from 8084
node app.js
```

Endpoints:

* `/`: The base endpoint which returns information regarding processes.
* `/:id/logs`: Return the logs for a process, `:id` is the UID of the forever process.

## Example

I run this on my server which runs my applications as `forever.js` processes (see [here](https://github.com/seanbreckenridge/vps/blob/d53ac1e76303c5b0d34b88d04101c3feff06420e/restart)):

```shell
FOREVER_LIST_TOKEN=secret_token_here node app.js
```
... and then I can query the status of the running applications from anywhere, to notify me of any issues going on:

```python
import requests

# I reverse proxy this to /forever-list, see below
resp = requests.get("https://mywebsite.com/forever-list",
                    headers={"token": "secret_token_here"})

# make sure server is running
resp.raise_for_status()
assert len(resp.json()) == 5  # however many processes you expect to be running with forever.js
```

For a more extensive example (the one that runs on my system as a
[i3block](https://github.com/vivien/i3blocks) blocket (runs every 5 minutes and
updates my status bar)), see [`monitor.py`](./monitor.py).

### Sample output:

Returns a list of JSON objects:

```
[
...
{'args': [],
  'command': '/snap/node/2310/bin/node',
  'ctime': 1584691385266,
  'file': 'app.js',
  'id': False,
  'isMaster': True,
  'logFile': '/home/sean/logs/foreverjs-list/forever.log',
  'pid': 12936,
  'restarts': 13,
  'running': True,
  'silent': False,
  'sourceDir': '/home/sean/code/foreverjs-list',
  'spawnWith': {'cwd': '/home/sean/code/foreverjs-list'},
  'uid': 'forever-list-api'}
  ...
  ]

```

### nginx

I route this to a path on my server so that the token in the header is encrypted with HTTPS:

```
server {
  listen 443 ssl ...
  ....

  location /forever-list/ {
    proxy_pass http://127.0.0.1:8084/;
  }
}
```
