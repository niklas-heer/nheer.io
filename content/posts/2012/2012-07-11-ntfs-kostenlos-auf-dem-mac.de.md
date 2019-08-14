---
title: NTFS kostenlos auf dem MAC
eyecatch: fa-wrench
description: 'NTFS kostenlos auf dem MAC'
date: 2012-07-11
tags: [mac, ntfs]
---

Wer kennt das nicht, man hat eine Festplatte von einem Windows-Rechner
oder evtl. einen USB-Stick und dann möchte man mit seinem Mac eigentlich
nur "kurz" eine Datei darauf schreiben, muss aber feststellen, dass das
so einfach gar nicht geht.

### 1. Option *(die kommerzielle Variante)*

Man installiert sich einfach: Paragon - NTFS für Mac® OS X 9.5 für 29,95€ kann man die Vollversion [hier](http://www.paragon-software.com/de/home/ntfs-mac/) kaufen.

_Vorteil:_ einfach zu installieren; schnell; performant und sorgenfrei

_Nachteil:_ kommerziell und naja... nicht gerade billig.


### 2. Option *(die kostenlose Variante)*

Die Installation ist nicht ganz so leicht.

#### 1. Schritt:
[OSXFuse](http://osxfuse.github.com/) installieren. Bei der Installation muss man darauf achten, dass man auch den MacFUSE Compatibility Layer mit installiert.

<center>
	<figure>
		<a href="/assets/images/2012-07-11/Fuse-install.jpg"><img src="/assets/images/2012-07-11/Fuse-install.jpg" alt=""></a>
		<figcaption>OSX Fuse</figcaption>
	</figure>
</center>

#### 2. Schritt:
Ihr installiert nun [NTFS-3G for Mac](http://www.macupdate.com/app/mac/24481/ntfs-3g/) hier müsst ihr bei Installationstyp auf "Anpassen" klicken und MacFUSE deaktivieren, da ihr das schon in Schritt 1 gemacht habt. Diese 2 Schritte sind nötig, weil es auf Lion anders leider nicht mehr funktioniert.

<center>
	<figure class="half">
		<a href="/assets/images/2012-07-11/NTFS-3G-1.jpg"><img src="/assets/images/2012-07-11/NTFS-3G-1.jpg" alt=""></a>
		<a href="/assets/images/2012-07-11/NTFS-3G-2.jpg"><img src="/assets/images/2012-07-11/NTFS-3G-2.jpg" alt=""></a>
		<figcaption>NTFS-3G for Mac</figcaption>
	</figure>
</center>

_Vorteil:_ komplett kostenlos; mit OSXFuse würden theoretisch noch andere Dateisysteme unterstützt

_Nachteil:_ evtl. nicht ganz optimale Performance (also ich habe keine Nachteile gemerkt); keine "einfach" Installation

### Fazit:

Also ich habe beide Varianten ausgiebig getestet und erst vor kurzem
festgestellt, dass es auch kostenlos geht. Ich werde wahrscheinlich bei
der kostenlosen Variante bleiben, weil OSXFuse eben auch Open Source ist
und dadurch natürlich auch wesentlich mehr Neuerungen und Anpassungen
zulässt. Ich hoffe ich konnte euch weiterhelfen, bei fragen einfach ein
Kommentar ;D
