+++
title = "**Strapdown**, fast markdown webpages"
icon = ":thinking:"
date = 2019-12-30T23:42:34+01:00
author = "Niklas Heer"
toc = false
images = ""
tags = ["netlify", "markdown", "html"]
+++

{{% info %}}**Update:** I've found another (better) solution. See my post about [eleventy]({{< relref "2020-01-03_eleventy.en.md" >}}) {{%/ info %}}

## Backstory

Currently I'm moving a lot of sites from my server hosted on [DigitalOcean](https://cloud.digitalocean.com) to [Netlify](https://www.netlify.com/) to save me time maintaining Linux servers. :sweat_smile:

Therefore I needed to migrate a page which was previously rendered by [caddy](https://caddyserver.com/) on the file to a page I can render with Netlify. But I didn't want to take out the big guns like [Hugo](https://gohugo.io/) because it is only one page with like two sentences on it.

## Strapdown to the resuce :muscle:

To be honest I search a little bit longer for this solution than I would have liked and I probably would have set up Hugo in that time, but anyway I found [Strapdown](http://strapdown.ztx.io/)! It is a Bootstrap theme which bundles a Javascript markdown converter.

This is what your `index.html` could look like to get a fully functional site which renders markdown on the fly:

```html
<!DOCTYPE html>
<html>
  <title>Hello, Strapdown</title>
  <meta charset="utf-8" />
  <xmp theme="cerulean" style="display:none;"
>

# Markdown Title

All your awesome markdown content goes here.

## Chapter 1

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore
et dolore magna aliqua.

## Chapter 2

MathJax is now supported, so the following will rock!

$$ \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right) $$

  </xmp>
  <script src="https://cdn.ztx.io/strapdown/strapdown.min.js"></script>
</html>
```

{{< figure src="2019/2019-12-30_screenshot-1.png" >}}

That's it. No `js` or `css` file. No build. No nothing. Just one `index.html`.

Now you just need to edit the markdown in between the `<xmp ...>` and `</xmp>` tags.

## Caveats

Is it the perfect solution? No! But a very quick one and if I only need a quick and dirty way to render an markdown site it does the job. Is there a better way? Maybe. But I didn't want to search even longer.

One other problem is that the original library [Strapdown](http://strapdownjs.com/) is not really maintained anymore. I liked to a fork [Strapdown-zeta](http://strapdown.ztx.io/) which has move features and more recent development, but it also doesn't look that active anymore. It would need `https`.

{{< figure src="2019/2019-12-30_screenshot-2.png" caption="Example taken from the [website](https://site.redblock.de) I used it for." >}}

## Conclusion

I think it is fine work a quick website you don't really care much about and don't plan to extent that much in the future. If you need a blog or more options with themes or you care more how it looks this is not for you. Else go ahead and hack away my friend! :smiley:
