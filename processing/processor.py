import os
import re
import sys


def get_log_match(filename: str):
    # format to check: yyyy-mm-dd-x.log and capture the date (group 1)
    pattern = r"^(\d{4}-\d{2}-\d{2})-\d\.log$"
    return re.match(pattern, filename)


# Ensure directory argument is provided
if len(sys.argv) < 2:
    print("Usage: python script.py <path_to_logs_directory>")
    sys.exit(1)

log_dir = sys.argv[1]

try:
    # Store tuples of (filename, match_object) so we have both the string and regex groups
    loglist = [
        (x, get_log_match(x)) for x in os.listdir(log_dir) if get_log_match(x)
    ]
except FileNotFoundError:
    print(f"Error: Directory '{log_dir}' not found.")
    sys.exit(1)

# List of regex filters we want to apply to each line
# [13:12:15] [Async Chat Thread - #15/INFO]: [Not Secure] <gamer0kayf1n3> hi chat
# [13:51:30] [Server thread/INFO]: atore1 has made the advancement [Into Fire]
keep_these_logs = [
    lambda x: re.search(
        r"^\[(\d{2}:\d{2}:\d{2})\] \[Server thread/INFO\]: ([a-zA-Z0-9_+]+) ((?:joined|left)) the game$",
        x,
    ),
    lambda x: re.search(
        r"^\[(\d{2}:\d{2}:\d{2})\] \[Async Chat Thread - #[0-9]+/INFO\]: \[Not Secure\] <([a-zA-Z0-9_+]+)> ([\W\w]+)$",
        x,
    ),
        lambda x: re.search(
        r"^\[(\d{2}:\d{2}:\d{2})\] \[Server thread/INFO\]: ([a-zA-Z0-9_+]+) has made the advancement \[([\W\w]+)\]$",
        x,
    ),
]

with open("chat-log.txt", "a", encoding="utf-8") as chatlog:
    for logname, file_match in loglist:
        file_path = os.path.join(log_dir, logname)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                for i,keep in enumerate(keep_these_logs):
                    match = keep(line)
                    if match and file_match:
                        # file_match.group(1) gives the date (yyyy-mm-dd) from the filename
                        # match.group(0) gives the full matched log line
                        if i == 0:
                            chatlog.write(f'{i},{file_match.group(1)},{match.group(1)},{match.group(2)},{int(match.group(3)=="joined")}\n')
                        if i == 1: 
                            chatlog.write(f'{i},{file_match.group(1)},{match.group(1)},{match.group(2)},{match.group(3).replace("\n","").replace(",", "\\,")}\n')
                        if i == 2:
                            chatlog.write(f'{i},{file_match.group(1)},{match.group(1)},{match.group(2)},{match.group(3).replace("\n","")}\n')
                        continue
                    