"""
This is a pretty personal script, it uses my dev environment
requires (python) httpx, (unix) notify-send and wait-for-internet
https://github.com/seanbreckenridge/wait-for-internet

Waits till I have an internet connection, and then
checks whether the the server and the correct
amount of processes are running (and dont seem to be
stuck restarting)

FOREVER_LIST_TOKEN # token to communicate with the HTTP server
FOREVER_LIST_COUNT # number of expected running processes
"""

import sys
import os
import time
import shlex
import subprocess

import httpx


def notify(message: str, critical: bool = True):
    """
    Sends me a notification using notify-send and exit
    set critical=False to just send the notification
    """
    subprocess.run(
        shlex.split(
            'notify-send {} "{}"'.format("-u critical" if critical else "", message)
        )
    )
    if critical:
        sys.exit(1)


# get the token and expected process count
try:
    token = os.environ["FOREVER_LIST_TOKEN"]
    expected_proc_count = int(os.environ["FOREVER_LIST_COUNT"])
except KeyError as ke:
    notify(f"Expected environment variable: {ke}")
except ValueError:
    notify("Could not convert value of FOREVER_LIST_COUNT to an integer")


#  does what it sounds like
os.system("wait-for-internet >/dev/null")

# make the request to the API
resp = httpx.get("https://seanbr.com/forever-list/", headers={"token": token})
resp_json = resp.json()

# if we couldnt connect to the remote api, notify me
# this also checks for 403 HTTP errors (wrong token)
try:
    resp.raise_for_status()
except httpx._exceptions.HTTPError as http_error:
    notify(str(http_error))

# make sure the expected number of forever processes are running
if len(resp_json) != expected_proc_count:
    notify("Expected to find {}, found {}".format(expected_proc_count, len(resp_json)))

# make sure all returned processes are running
for proc in resp_json:
    # explicity not running
    if not proc["running"]:
        notify("{} is not running".format(proc["uid"]))
    # if it was started recently and has more than one restart, warn me
    if time.time() - proc["ctime"] < 60 * 10 and proc["restarts"] > 0:
        notify(
            "Warning: {} was restarted in the last few minutes and has restarted {} times, could signify crashed process".format(
                proc["uid"], proc["restarts"]
            ),
            critical=False,
        )
