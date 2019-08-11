---
title: automatischer Upload von Bildern in der Zwischenablage
eyecatch: fa-code
description: automatischer Upload von Bildern in der Zwischenablage
date: 2012-07-11
tags: [code, mac]

---

Ihr kennt das vielleicht, ihr habt ein Bild mit "⌘ + Ctrl + ⇧ + 4"
gemacht und wollt diesen Screenshot nun mit jemandem teilen, mit dem ihr
evtl. gerade chattet oder eine Email schreibt oder oder oder.

Ich habe eine wirklich schnelle Lösung für dieses Problem gefunden.
Leider braucht ihr ein bisschen Einrichtungszeit und auch ein spezielles
Tool dafür.

### *Was wir brauchen:*

* [Textexpander](http://itunes.apple.com/de/app/textexpander-for-mac/id405274824?mt=12) leider nicht ganz billig mit 27,99€, aber ein wirklich mächtiges und gutes Tool.
* Applescript (schon bei Mac dabei)
* einen Webspace mit FTP Zugriff. (kostenlos: [zum Artikel](http://forum.chip.de/webspace-webserver-webhosting/kostenloser-webspace-160515.html) - ich kann auch [Funpic](http://www.funpic.de/) empfehlen)

<span style="text-decoration: underline;">**1. Schritt Erstellung der Scripte:**</span>

Upload-terminal muss auf jeden Fall angepasst werden. "save\_img\_from\_clip.scpt" kann so bleiben ;)

<div class="download-button"><a href="/assets/files/2012-07-11/Upload-terminal.scpt" class="btn btn-success btn-lg">download Upload-terminal.scpt</a></div>
<br>
<div class="download-button"><a href="/assets/files/2012-07-11/save_img_from_clip.scpt" class="btn btn-success btn-lg">download save_img_from_clip.scpt</a></div>

Am besten man speichert sie unter "/Users/\<username\>/Scripte" ab.


<span style="text-decoration: underline;">**2. Schritt Erstellung des
Textexpander Makros:**</span>

Dieser Code muss angepasst werden mit euren Pfaden und in Textexpander
eingefügt werden:

```
-- Code unterliegt der CC BY-NC-SA (http://creativecommons.org/licenses/by-nc-sa/3.0/)
-- Autor: Niklas Heer (http://niklas-heer.de)

-- der CMD Pfad muss zu eurem Pfad zeigen, in dem das "save_img_from_clip.scpt" Script liegt
set CMD to "osascript /Users/nh/Dropbox/AppleScripts/Plaintext/save_img_from_clip.scpt"
ignoring case
    set pic_path to (do shell script CMD)

        -- der CMD_upload Pfad muss zu eurem Pfad zeigen, in dem das "Upload-terminal.scpt" Script liegt
    set CMD_upload to "osascript /Users/nh/Dropbox/AppleScripts/Plaintext/Upload-terminal.scpt " &amp; pic_path
    set pic_url to (do shell script CMD_upload)

end ignoring
```

<center>
	<figure>
		<a href="/assets/images/2012-07-11/TextExpander1.jpg"><img src="/assets/images/2012-07-11/TextExpander1-150x150.jpg" alt=""></a>
		<figcaption>TextExpander</figcaption>
	</figure>
</center>


**FERTIG!**

Nun könnt ihr überall einfach "/upload" (oder wie immer ihr es genannt
habt) eingeben und sofort wird "/upload" mit der URL zu eurem Bild
ersetzt, dass auf euren Server hochgeladen wurde.

Noch ein paar Anmerkungen: Es nimmt auch nicht viel Platz weg, da es
immer dasselbe Bild neu erzeugt und überschreibt, das heißt auch, dass
die URLs die ihr damit verschickt nur temporär sind, da sie bei der
nächsten Verwendung dann schon auf ein neues Bild zeigen. Da hätte ich
auch schon eine Lösung und zwar müsste man dafür "einfach" das
Upload-terminal Script anpassen, sodass dieses noch Argumente für den
Dateinamen bekommt. Und im Textexpander Script müsste man noch ein
FillForm für diesen Dateinamen angeben. Wenn ihr es mögt werde ich die
Funktionalität evtl. später mal hinzufügen. Betrachtet das mal als Beta!
