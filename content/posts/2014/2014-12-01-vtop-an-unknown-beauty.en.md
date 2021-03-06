+++
title = "`vtop` an unknown terminal beauty"
icon = ":heart_eyes:"
date = 2014-12-01
published = true
tags = ["code", "terminal", "linux"]
+++

<blockquote>
<p>Wow such top. So stats. More better than regular top. Written in node.js</p>
<cite><a href="https://parall.ax/vtop">vtop</a></cite>
</blockquote>

I've been using `top` since I started maintaining a server in 2010. <br>
It's a really powerful tool to glance at it and see if your system is alright, but since I discovered `htop`, `top` was made obsolete for me.

Although I really liked `htop` I always felt that it sometimes had a too clunky representation of the data, so that I couldn't quickly enough see if my system was acting out of the common workload.

Than I discovered `vtop`! <br>
But let's start at the beginning of my journey.

## Why not simple old `top`

{{< figure src="2014-12-01/top.png" position="center" caption="top" >}}
{{< figure src="2014-12-01/htop.png" position="center" caption="htop" >}}

As you can guess from the pictures above `htop` does really exactly the same as `top`, but in a much nicer way so in my opinion there is no discussion about why you would choose `top` over `htop`!

## vtop the unknown beauty

{{< figure src="2014-12-01/vtop.png" position="center" caption="vtop" >}}

[vtop][vtop] looks much cleaner than htop. One look and you exactly know whats going on on the system! You can list processes by CPU or Memory usage which is really awesome, you can navigate with your arrow keys or `k` and `j` which is also nice and the best of all you can simply highlight/select a process and kill it by typing `dd`!

You can install it also very easily through `npm` (you need to install [node.js](http://nodejs.org/) on your system)!

```bash
sudo npm install -g vtop
```

After that you can execute it by typing `vtop`

I really love it! Maybe there are some use-cases where I still need `htop` e.g. when I want to find a PID and don't need it to kill the process, but `vtop` is now a part of my daily used tool!

**_Try it out yourself!_**

[vtop]: https://github.com/MrRio/vtop
