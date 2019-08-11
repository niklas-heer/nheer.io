---
title:  "Hello Jekyll!"
eyecatch: "fa-code"
date:   2014-11-30
categories: jekyll update
---
I changed my blog from [Wordpress][wordpress] to [Jekyll][jekyll]!

## Why i switched to Jekyll
I was thinking about switching from [Wordpress][wordpress] to something else for quite a while, but I didn't find anything I really liked.

First I thought about switching my blog to a self made [Laravel][laravel] site, but it's kind of reinventing the wheel.
It's a lot of work and is still open to bugs and exploits and therefore has to be updated really often - which I was not willing to do and also didn't had the time for to do.
Also I still would have PHP Code which to be totally honest I don't really like because it is really slow in comparison to [Node.js][nodejs] or [Go][go] code.

My second thought was to implement my blog in [Go][go]. Yay! The response time would be amazing and I sure would learn a lot - given I only played around with [Go][go] so far.
But then again - a lot of overhead, fast out-of-date and time-consuming to maintain.

At first I was against static site generation.

I search a while and read a little bit more about static site generation and the more I thought about it the more it became clear to me: "This is the way to go."

Static site generation was the key to the cons I had previously had against other solution. No security risks, because it is "only" HTML and no code is compiled on the server at runtime. No overhead - there are a lot of great static site generators out here and it would be - once set up - really fast to write articles and publish them.

*Okay, so where to start?* <br>
There is [Pelican][pelican], [Pico][pico], [Nikola][nikola] and of course [Jekyll][jekyll].

So I looked at them all with the following requirements:

- easy to use
- can import my post from [Wordpress][wordpress] (would turn out as a 'biggy')
- support [Markdown][markdown]
- actively maintained
- easy way to preview my work before uploading it to any server


### **[Nikola][nikola]**<br>
I started with [Nikola][nikola] because it seemed like the perfect fit to me. It met all my requirements and also was very easy to install on [ArchLinux][arch] (```yaourt -S python-nikola-git```).
So I headed right into it made a new git repo and ```nikola init``` to start a new [Nikola][nikola] instance.
Okay now let's import my [Wordpress][wordpress] posts.<br>
I made exported my posts from within [Wordpress][wordpress] thought a XML file and executed [Nikolas][nikola] built-in import method ```nikola import_wordpress posts.xml```. Wow, that was easy.
Nope. Error. Damn it! [DuckDuckGo][duckduck] to the rescue!
Okay installed [Nikola][nikola] from source on Github. Still that Error.
After a few hours of fumbling around I admitted defeat and moved on the the next generator on my list.

### **[Pelican][pelican]**<br>
Aswell as [Nikola][nikola], [Pelican][pelican] checked off everything on my list so i also installed it. This time through [pip][pip]. Just for funsies.

``` bash
pip install pelican markdown
pelican-quickstart
```

Okay so now let's import it.

``` bash
pelican-import --wpfile --dir-page -o content -m markdown posts.xml
```

Cool, so far so good let's look at my files.

``` bash
python -m SimpleHTTPServer
```

Doesn't work. Mhmmm... let's try Python2.

``` bash
python2 -m SimpleHTTPServer
```

Eureka! Long story short I really didn't like the way theming works in [Pelican][pelican]. Although I thought I could live with that, there where still some alternatives on my list and I thought: "Better make sure you like it, because you'll be using it for quite a while!"

### **[Pico][pico]**<br>
Okay so I started on [Picos][pico] website. Oh my.. PHP? Why? Oh boy, now I have to set up a complete web developing environment for a "simple" static site generator? Nah!<br>
So I searched for lightweight Web-Servers for in-place use.<br>
I discovered [node-sng](http://code.ravelsoft.com/node-sng) and thanks to [Arch][arch] it was also easy to install.

But at this point I thought I just drop [Pico][pico] because it is not practical for me and thus I wouldn't use it for long.

### **[Jekyll][jekyll]**<br>
Let's try the clear mainstream option. Nice checks off everything on my list.

``` bash
gem update
gem install jekyll
```

Nice! So let's import everything. [Awesome Doc](http://import.jekyllrb.com/docs/wordpressdotcom/) is awesome!

``` bash
ruby -rubygems -e 'require "jekyll-import";
    JekyllImport::Importers::WordpressDotCom.run({
      "source" => "wordpress.xml",
      "no_fetch_images" => false,
      "assets_folder" => "assets"
    })'
```

Mhm.. now my posts are still in HTML - I want them in ```.md``` format. Okay Bash-Script to the rescue! (you need [pandoc](http://johnmacfarlane.net/pandoc/installing.html) to use this script)

``` bash
#!/bin/bash
FILES=/home/nh/Desktop/posts/*
MDFOLDER=/home/nh/Desktop/mdfiles/
for f in $FILES
do
    completename="${f##*/}"          # complete file name with .ext
    filename="${completename%.*}"    # name without .ext
    mdname="$filename.md"            # lets add .md extension

    pathToMd="$MDFOLDER$mdname"      # define the output path

    # Let's rock!
    echo "Processing $mdname"
    pandoc -s "$f" -o "$pathToMd"
done
```

Awesome! Let's compile them and look at what I've got so far.

``` bash
jekyll serve -w
```

Oh it looks kind of messy. The file header it not right. Okay I will go through my posts I also need to change some image urls and stuff.<br>
Nice auto-compile function! While we're at it let's also install a [nice theme](https://mademistakes.com/articles/hpstr-jekyll-theme/).

Here are some useful code-blocks:
{{< gist 25336b9b6758a35b720b >}}

## Conclusion
Although it was quite some time editing 60+ posts I really like the result and you may like it too! I'm really glad I took the journey to discover [Jekyll][jekyll].

This very article is my first one completely written in [Jekyll][jekyll] on my beloved [SublimeText-Editor][sublime] with some Plugins. ([Jekyll](https://sublime.wbond.net/packages/Jekyll), [Markdown Preview](https://sublime.wbond.net/packages/Markdown%20Preview) and [Markdown​Editing](https://sublime.wbond.net/packages/MarkdownEditing))

I hope I gave you some insights in my journey and maybe you can save yourself some trouble and fist try [Jekyll][jekyll] before you end up digging through the entire internet to find a static site generator you like.

Good luck! ;)





[jekyll]: http://jekyllrb.com
[wordpress]: https://wordpress.org/
[laravel]: http://laravel.com/
[go]: https://golang.org/
[nodejs]: http://www.nodejs.org/
[pelican]: http://blog.getpelican.com/
[pico]: http://picocms.org/
[nikola]: http://getnikola.com/
[markdown]: https://help.github.com/articles/github-flavored-markdown/
[arch]: https://www.archlinux.org/
[duckduck]: https://duckduckgo.com/
[pip]: https://pypi.python.org/pypi/pip/
[sng]: http://code.ravelsoft.com/node-sng
[sublime]: http://www.sublimetext.com/
