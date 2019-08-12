---
title: 'Ubuntu 13.04 - Ein besserer File-Browser'
eyecatch: fa-terminal
slug: "ubuntu_pantheon-files"
description: 'Ubuntu 13.04 - Ein besserer File-Browser'
date: 2013-04-30
tags: [code, linux, ubuntu]
---

<center>
	<figure>
		<a href="/assets/images/2013-04-30/Arbeitsfläche-1_002.png"><img src="/assets/images/2013-04-30/Arbeitsfläche-1_002.png" alt=""></a>
		<figcaption>Pantheon Files</figcaption>
	</figure>
</center>

Diejenigen unter euch, die sich schon das neue Ubuntu 13.04 geladen haben, haben sicher schon gemerkt, dass der File-Explorer neu gestaltet wurde. Im Prinzip ist es aber immer noch der gute alte Nautilus.

Jeder der schon mal den Finder von Mac OS gesehen hat, hat sicher die "komische" Ansicht gesehen, die es in diesem File-Explorer gibt.

Doch diese Ansicht ist kein von Apple selbst entwickelte Ansicht, sondern vielmehr ist es ein schon recht alter Standard für die Ansicht von Dateien und Ordnern (seit 1980).

Diese Ansicht nennt man [Miller Columns](http://en.wikipedia.org/wiki/Miller_columns) diese Ansicht ist besonders effizient und übersichtlich um mit Dateien zu arbeiten.

Das ist so ziemlich der Hauptgrund wieso ich nach einem alternativen File-Browser gesucht hab.

Und mit [Pantheon-Files](https://launchpad.net/pantheon-files) einem Fork von [Marlin](https://launchpad.net/marlin) ist und auch im Gegensatz zu Marlin aktiv entwickelt wird, wurde ich fündig!

Ich kann euch diesen Filebrowser nur wärmstens empfehlen!

### Installation:

``` bash
sudo add-apt-repository ppa:elementary-os/daily
sudo apt-get update
sudo apt-get install pantheon-files
```

Danach solltet ihr es per Terminal starten, da der Ubuntu-Launcher beide Explorer unter demselben Namen führt.

``` bash
pantheon-files
```

Danach könnt ihr den Explorer in eurem Launcher verankern und dann mit Strg+C den Prozess beenden.
