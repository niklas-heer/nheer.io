---
title: 'Thinklight Script für Linux'
eyecatch: fa-code
description: 'Thinklight Script für Linux'
date: 2013-04-29
tags: [code, linux, thinkpad]
---

Wolltet ihr schon immer mal das LED-Licht in einem Script benutzen, oder es einfach nur per Terminal-Befehl an- und ausschalten?

Wenn ja dann hab ich hier eine Lösung für euch:

### 1. Voraussetungen prüfen:

```
    lsmod | grep pad
```

sollte ungefähr so aussehen:


```
thinkpad_acpi          81222  0
nvram                  14362  1 thinkpad_acpi
```

falls nicht kann man das Kernel-Modul damit nachinstallieren:

```
sudo modprobe -v thinkpad-acpi
```

### 2. Script installieren

Script an dem richtigen Ort herunterladen und ausführbar machen:

``` bash
sudo wget -O /usr/local/bin/thinklight https://gist.github.com/niklas-heer/5490084/raw/990ab4c0ec70a39791b4369fddc2e12498c82cd0/thinklight
sudo chmod +x /usr/local/bin/thinklight
```

### 3. Script benutzen

Zum Anschalten:
`sudo thinklight on`

Zum Abschalten:
`sudo thinklight off`

Und hier noch das Script selbst ;D

``` bash
#!/bin/sh
if [ "$1" = "on" ]; then
    echo 1 > /sys/devices/platform/thinkpad_acpi/leds/tpacpi::thinklight/brightness
elif [ "$1" = "off" ]; then
    echo 0 > /sys/devices/platform/thinkpad_acpi/leds/tpacpi::thinklight/brightness
else
    echo "Error: Wrong paramater! Only on/off allowed!"
fi
```
