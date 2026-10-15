# Minecraft Log Reader

A processor and web app that processes Minecraft log files and converts them into something viewable from a website.

## Process

1. Run `python3 processing/processor.py <your Minecraft log folder>`.
2. Compress the output `chat-log.txt` to a gzip file.
3. Rename it to `chat-log.bin` so Vite behaves, then place it in the `public/` directory.
4. Compile.

## Output

Currently, the log reader hunts and outputs 3 types of logs.

- Player join/leaves
- Player messages
- Player advancements

## Tested with

- Cracked-friendly Paper 1.21.11 server
- Windows 10

