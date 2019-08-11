+++
date = "2015-08-18T10:21:41+02:00"
eyecatch= "fa-code"
title = "Hello Hugo!"
description = "Hugo, even faster than jekyll"
+++

<center>
    <figure>
        <a href="/assets/images/2015-08-18/screen.png"><img src="/assets/images/2015-08-18/screen.png" alt=""></a>
        <figcaption>even faster than jekyll</figcaption>
    </figure>
</center>

## Why I switched to [Hugo][hugo]
[Jekyll][jekyll] was my first real static site generator. I loved it! There was only one problem: I really dislike ruby and the gem system. It is simply too slow!

### The speed battle
Lately I've been obsessed with the [Go](http://golang.org/) language. Because of that I discovered [Hugo][hugo], which also makes use of the Go language. This is why it is so fast. Normally my site builds in 120ms with Hugo. That is incredibly fast! Jekyll takes much longer, even minutes sometimes!

{{< youtube CdiDYZ51a2o >}}

### Functionality
Speed is nice, but I also should be able to use my static site generator as I used to. Hugo does exactly that. I would even go further and say Hugo does everything Jekyll does better. For example embedding videos, was not that easy in Jekyll. In Hugo I can just make a shortcode like this:

``` html
<div class="video embed video-player">
  <iframe class="youtube-player" type="text/html" src="https://www.youtube.com/embed/{{ index .Params 0 }}" allowfullscreen frameborder="0">
  </iframe>
</div>
```
And save the file under `layouts\shortcodes\youtube.html` and now I can embed YouTube videos with `{{</* youtube CdiDYZ51a2o */>}}`. Where `CdiDYZ51a2o` is the ID of the YouTube video.

That is pretty neat.

## My new Workflow
### Locally
<center>
    <figure>
        <a href="/assets/images/2015-08-18/screen2.png"><img src="/assets/images/2015-08-18/screen2.png" alt=""></a>
        <figcaption>My workspace when I'm writing</figcaption>
    </figure>
</center>

When I'm writing new posts, I can view my changes instantly in my browser. Hugo serves my page locally and rebuilds and reloads the site whenever I change and save a file. This is achieved with this command: `hugo server -w -t "nh"`. When listening it should look similar to this:

<center>
    <figure>
        <a href="/assets/images/2015-08-18/screen3.png"><img src="/assets/images/2015-08-18/screen3.png" alt=""></a>
    </figure>
</center>

### Online
I moved my blog entirely to Github. It also builds itself when I push changes. This is achieved with a Github-Webhook which calls the PHP-Script below.
A more detailed instruction on how to set this up, can be found [here](https://gist.github.com/dud3/16a607ba730457b60cfb).

``` php
<?php
	/**
	 * GIT DEPLOYMENT SCRIPT
	 *
	 * Used for automatically deploying websites via github or bitbucket, more deets here:
	 *
	 *		https://gist.github.com/1809044
	 */

	// The commands

	// Maybe for later use:
	//
	// git - discard changes
	// 		'git stash save --keep-index',
	//	    'git stash drop',
	$commands = array(
		'whoami',
		'pwd',
		'git pull origin master',
		'git status',
		'/usr/local/bin/hugo',
	);

	// Run the commands for output
	$output = '';

	// Change to working directory
	chdir('/var/www/sites/blog');
	foreach($commands AS $command){
		// Run it
		$tmp = shell_exec($command);
		// Output
		$output .= "<span style=\"color: #6BE234;\">\$</span> <span style=\"color: #729FCF;\">{$command}\n</span>";
		$output .= htmlentities(trim($tmp)) . "\n";
	}

	// Make it pretty for manual user access (and why not?)
?>
<!DOCTYPE HTML>
<html lang="en-US">
<head>
	<meta charset="UTF-8">
	<title>GIT DEPLOYMENT SCRIPT</title>
</head>
<body style="background-color: #000000; color: #FFFFFF; font-weight: bold; padding: 0 10px;">
<pre>
 .  ____  .    ____________________________
 |/      \|   |                            |
[| <span style="color: #FF0000;">&hearts;    &hearts;</span> |]  | Git Deployment Script v0.1 |
 |___==___|  /              &copy; oodavid 2012 |
              |____________________________|

<?php echo $output; ?>
</pre>
</body>
</html>
```

You should place this script somewhere in `static`, because Hugo will put files in this directory directly in the `public` folder.
I also recommend to set your webroot to the `public` folder of your Hugo project.

<center>
    <figure>
        <a href="/assets/images/2015-08-18/screen4.png"><img src="/assets/images/2015-08-18/screen4.png" alt=""></a>
    </figure>
</center>

Additionally you can install the [Hugo binary](https://github.com/spf13/hugo/releases) on your server to build the site automatically, when you push any changes.
This is the way I chose to do it.
This also allows me to write and publish articles from machines which have nothing else than an text-editor and git, which is pretty every computer.


## Conclusion
<blockquote>
Hugo does everything what jekyll does, but better and faster. Go for the win!
</blockquote>

Bloging with a static site generator does get easier than this. I highly recommend Hugo to everyone who's interested in static site generators! Or to those who just want to try them out.
You don't have to setup much to get going, which is a huge plus. Also if you want to deploy your site/blog it is much easier than with Jekyll.

I hope this article was interesting or helpful to you! If it was, please leave me a comment with your thoughts!

Cheers!


[jekyll]: http://jekyllrb.com/
[hugo]: http://gohugo.io/
