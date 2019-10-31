---
title: "Thinklight Script for Linux"
icon: ":page_facing_up:"
description: "Thinklight Script für Linux"
date: 2013-04-29
tags: [code, linux, thinkpad]
---

Did you always wanted to use your LED light in a script or just use a terminal command to turn it on or off?

If you answer was yes, than this is for you:

### 1. Checking the requirements

```bash
lsmod | grep pad
```

Should output something like:

```bash
thinkpad_acpi          81222  0
nvram                  14362  1 thinkpad_acpi
```

If not you'll need to install a kernel module first:

```bash
sudo modprobe -v thinkpad-acpi
```

### 2. Install the script

Download the script and move it to the right location:

```bash
sudo wget -O /usr/local/bin/thinklight https://gist.github.com/niklas-heer/5490084/raw/990ab4c0ec70a39791b4369fddc2e12498c82cd0/thinklight
sudo chmod +x /usr/local/bin/thinklight
```

### 3. Use the script

Turn it on:
`sudo thinklight on`

Turn it off:
`sudo thinklight off`

This is the script :wink:

{{< gist niklas-heer 5490084 >}}
