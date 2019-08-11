---
title: "R.I.P. WhatsApp - Es lebe Telegram!"
slug: "Threema-vs-Telegram"
description: 'R.I.P. WhatsApp - Es lebe Telegram!'
date: 2014-02-20
tags: [discussion, news, tutorial]
---

<center>
	<em><small>Disclaimer: Dieser Beitrag kann ironische/sarkastische Passagen enthalten. Er ist stellenweise wahrscheinlich sehr technisch. Achso und nein ich bekomme kein Geld von Telegram, ich bin einfach davon überzeugt.</small></em>
</center>


Okay also wir wissen, dass [WhatsApp](https://telegram.org/faq#q-how-secure-is-telegram) das
Imperium ist und von [Facebook verschlungen](http://www.heise.de/newsticker/meldung/Facebook-kauft-WhatsApp-2118920.html) zu werden, kann den Imageschaden der durch [zahlreiche Sicherheitsskandale](http://de.wikipedia.org/wiki/WhatsApp#Sicherheit.2FKritik) in der Vergangenheit verursacht wurde auch nicht kitten.
Also was tut nur der sicherheitsbewusste User? Er wechselt zu [Telegram](https://telegram.org/)!

Warum Telegram und nicht Threema? 
---------------------------------

Threema ist eine nicht-freie und kostenpflichtige App. Nicht-frei, was soll das denn heißen?
Das bedeutet, dass Threema nicht zu [FOSS [Free and Open Source Software]](http://de.wikipedia.org/wiki/Free/Libre_Open_Source_Software) gehört. 
Das ist bei sicherheitskritischen Anwendungen essenziell um sicher zu sein, dass etwas wirklich sicher ist, denn bei FOSS [hat jeder Zugriff zum Quelltext der Software](https://www.gnu.org/philosophy/free-sw.html) und man kann
überprüfen, ob die Software auch das macht was der Hersteller behauptet.

***Warum kann man sich bei Threema also nicht sicher sein?*** <br>
Zwar benutzt laut Hersteller-Angaben [eine freie Bibliothek](http://nacl.cr.yp.to/) (das heißt dieser Teil ist FOSS) für die eigentliche verschlüsselte Kommunikation und hat zur Überprüfung dafür auch extra ein [spezielles Logging](https://threema.ch/validation/) bereit gestellt, aber dadurch, dass nicht das komplette Programm einsehbar ist, ist es nicht auszuschließen, dass der Hersteller die Daten - selbst wenn tatsächlich mit [NaCl](http://nacl.cr.yp.to/) verschlüsselt wird - nicht irgendwo anders abgreift.
Das ginge eben nur wenn Threema selbst FOSS wäre, dies ist aber leider nicht der Fall.
Dies weiß auch der Hersteller unddeshalb sagte er in einem Interview mit der Zeit:  ["Letztlich ist es eine Gefühlssache, ob man mir vertrauen will"](http://www.zeit.de/digital/mobil/2013-07/threema-app-manuel-kasper/seite-2)

***Was macht Telegram also anders?***<br>
Zu aller erst ist Telegram FOSS! Telegram steht unter der [GPLv2](http://www.gnu.de/documents/gpl-2.0.de.html) und ist damit freie Software.
Zudem gibt des den aktuellen Quelltext für die Android-Version auf [Github](https://github.com/DrKLO/Telegram) und somit ist auch eine einfache Zugangsmöglichkeit gegeben. 

***Okay Telegram ist frei, aber wie sieht es jetzt mit der Verschlüsselung aus?***<br>
Also kommen wir zum Eingemachten. 
Dies mag für den ein oder anderen zuerst kontrovers erscheinen, macht aber bei näherer Betrachtung durchaus Sinn. 
Telegram hat sein [eigenes Protokoll](https://core.telegram.org/mtproto) für die sichere Kommunikation entwickelt, damit der Versand von Nachrichten schnell geht und man auch die Chat-History von anderen Geräten aus einsehen kann. 
Man ist also immer synchron und kann schnell auch Fotos und Dateien versenden. 
Damit ist aber die Nachricht an sich nur von Client zu Server und von dort wieder von Server zu Client verschlüsselt.
Hier wurde auf Grund der schnellen Übertragung ein Kompromiss zwischen Sicherheit und schneller Verfügbarkeit eingegangen. 
Deshalb gibt es bei Telegram auch die ["secret chats"](https://telegram.org/faq#secret-chats) diese sind dann End-zu-End verschlüsselt.
Das bedeutet, dass die Nachricht weder von einem Dritten noch vom Hersteller gelesen werden kann, sondern nur von
den Gesprächspartnern.
Dies hat ein paar Nachteile, wie zum Beispiel das Wegfallen der Synchronisation über mehrere Geräte, denn die Nachricht ist nur auf dem Empfangsgerät verfügbar. Mann kann aber auch Sachen einstellen wie das automatische Selbstzerstören einer Nachricht.
Damit hat Telegram in der Hinsicht dieselbe Funktionalität wie Threema, denn dort ist das [Synchronisieren über mehrere Geräte hinweg auch nicht möglich](https://threema.ch/de/faq.html#platform_switch).

[Quelle: [Telegram FAQ](https://telegram.org/faq#security) und [Threema FAQ](https://threema.ch/de/faq.html)]

Extras
------

Telegram hat ja sogar noch eine [API](https://core.telegram.org/api) welche es Entwicklern ermöglicht die vorhandene Infrastruktur von Telegram zu benutzen und eigene Funktionalität hinzu zu fügen oder einfach Telegram auf anderen Plattformen wie zum Beispiel dem [Desktop](https://telegram.org/apps) zur Verfügung zu stellen.
Das ist nicht nur Spielerei sondern wir werden dadurch in Zukunft hoffentlich viel coole neue Software sehen.

**Fazit**
---------

Telegram ist im Vergleich zu Threema kostenlos und dazu noch freie Software.
Es hat eine Api um Entwicklern das Verwenden von Telegram zu erleichern und es ist mindestens genauso sicher wie Threema, wenn nicht gar noch sicherer.
Hinzu kommt die extra Funktionalität und die Tatsache, dass Telegram eine [non-profit Unternehmung](https://telegram.org/faq#q-how-are-you-going-to-make-money-out-of-this)
