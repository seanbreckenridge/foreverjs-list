# foreverjs-list

An express server that serves information about [`forever.js`](https://github.com/foreversd/forever) processes

Uses a secret token to authenticate requests, exposes the `forever.js` `list` command output as JSON.

# Install

```shell
git clone https://github.com/seanbreckenridge/foreverjs-list
cd foreverjs-list
npm install
# set required token somewhere (put in some environment file (e.g. ~/.bashrc)
export FOREVER_LIST_TOKEN=v1E074hIiW0WJ2vv3G1S
# you may set the FOREVER_LIST_PORT to change the default port from 8084
node app.js
```

## Example

```shell
FOREVER_LIST_TOKEN=secret_token_here node app.js
```

```python
import requests

# I reverse proxy this to /forever-list, see below
resp = requests.get("https://mywebsite.com/forever-list",
                    headers={"token": "secret_token_here"})

# make sure server is running
resp.raise_for_status()
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
