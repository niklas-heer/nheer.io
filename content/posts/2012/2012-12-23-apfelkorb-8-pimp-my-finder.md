---
title: 'Apfelkorb #8 - Pimp my Finder'
eyecatch: fa-youtube-play
slug: apfelkorb-8_Finder
description: 'Apfelkorb #8 - Pimp my Finder'
date: 2012-12-23
tags: [youtube, apfelkorb]
---

In dieser Folge zeige ich euch wie ihr versteckte Funktionen im Finder aktiviert, eure QuickLook-Anzeige erweitert und ein paar Finder-Alternativen.

Folge in dem ich euch den Befehl zeige Dateien sichtbar zu machen: <http://bit.ly/TZcN0i>

***QuickLook Text selektieren:***

Befehl zum anschalten: <br>
``` bash
defaults write com.apple.finder QLEnableTextSelection -bool TRUE; killall Finder
```
Befehl zum ausschalten: <br>
``` bash
defaults delete com.apple.finder QLEnableTextSelection; killall Finder
```

***QuickLook Plugin installieren:***

Nimm das entsprechende Plugin (*xxx.qlgenerator*) und verschiebe es in eins der folgenden Verzeichnisse. <br>
```/Library/QuickLook``` - verschiebe es dort hin um es für jeden Nutzer zu installieren <br>
```~/Library/QuickLook``` - verschiebe es hier hin um es nur für dich zu installieren (dein Homeverzeichnis)

Dann führe folgenden Befehl im Terminal aus: <br>
```qlmanage -r``` oder melde dich ab und wieder an.

mein QuickLook Plugin Pack: [download](/assets/files/2012-12-23/Quick-Look_Plugins.zip) <br>
mehr QuickLook-Plugins: <http://www.qlplugins.com/> <br>
Zip QuickLook-Plugin: <http://macitbetter.com/BetterZip-Quick-Look-Generator/> <br>
Total Finder (ca. 13,50€) - <http://totalfinder.binaryage.com/> <br>
Path Finder (ca. 30€) - <http://cocoatech.com/pathfinder/> <br>
ForkLift (ca. 15€) - <http://www.binarynights.com/> <br>

{{< youtube TmPBrhVv_uY >}}
