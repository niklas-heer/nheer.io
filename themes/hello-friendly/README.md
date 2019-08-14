# Hello Friendly

<!-- TODO: Add image like: ![Hello Friendly](https://dsh.re/d27822) -->

## General information

This theme is my take on the great [hello-friend-ng](https://github.com/rhazdon/hugo-theme-hello-friend-ng) theme.

## Features

- Theming: **dark/light mode**, depending on your preferences (dark is default, but you can change it)
- Great reading experience thanks to [**Inter UI font**](https://rsms.me/inter/), made by [Rasmus Andersson](https://rsms.me/about/)
- Nice code highlighting thanks to [**PrismJS**](https://prismjs.com)
- An easy way to modify the theme with Hugo tooling
- Fully responsive
- Support for social

### Built-in shortcodes

- **`image`** (prop required: **`src`**; props optional: **`alt`**, **`position`** (**left** is default | center | right), **`style`**)
  - eg: `{{< image src="/img/hello.png" alt="Hello Friend" position="center" style="border-radius: 8px;" >}}`
- **`figure`** (same as `image`, plus few optional props: **`caption`**, **`captionPosition`** (left | **center** is default | right), **`captionStyle`**
  - eg: `{{< figure src="/img/hello.png" alt="Hello Friend" position="center" style="border-radius: 8px;" caption="Hello Friend!" captionPosition="right" captionStyle="color: red;" >}}`

### Code highlighting

By default the theme is using PrismJS to color your code syntax. All you need to do is to wrap you code like this:

<pre>
```html
  // your code here
```
</pre>

**Supported languages**: https://prismjs.com/#languages-list

## How to start

You can download the theme manually by going to [https://github.com/niklas-heer/hugo-theme-hello-friendly.git](https://github.com/rhazdon/hugo-theme-hello-friendly.git) and pasting it to `themes/hello-friendly` in your root directory.

You can also clone it directly to your Hugo folder:

```bash
git clone https://github.com/niklas-heer/hugo-theme-hello-friendly.git themes/hello-friendly
```

If you don't want to make any radical changes, it's the best option, because you can get new updates when they are available. To do so, include it as a git submodule:

```bash
git submodule add https://github.com/niklas-heer/hugo-theme-hello-friendly.git themes/hello-friendly
```

### Favicon

Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate these files, put them into your site's static folder:

- android-chrome-192x192.png
- android-chrome-512x512.png
- apple-touch-icon.png
- favicon-16x16.png
- favicon-32x32.png
- favicon.ico
- mstile-150x150.png
- safari-pinned-tab.svg
- site.webmanifest

## How to configure

The theme doesn't require any advanced configuration. Just copy:

```toml
baseurl = "/"
languageCode = "en-us"
theme = "hello-friendly"

[params]
  dateform        = "Jan 2, 2006"
  dateformShort   = "Jan 2"
  dateformNum     = "2006-01-02"
  dateformNumTime = "2006-01-02 15:04 -0700"

  # Metadata mostly used in document's head
  description = "Homepage and blog by Niklas Heer"
  keywords = "homepage, blog, science, informatics, development, programming"
  images = [""]

  # Directory name of your blog content (default is `content/posts`)
  contentTypeName = "posts"
  # Default theme "light" or "dark"
  defaultTheme = "dark"

[languages]
  [languages.en]
    title = "Hello Friendly"
    subtitle = "A simple theme for Hugo"
    keywords = ""
    copyright = ""
    readOtherPosts = "Read other posts"

    [languages.en.params.logo]
      logoText = "hello friendly"
      logoHomeLink = "/"
    # or
    #
    # path = "/img/your-example-logo.svg"
    # alt = "Your example logo alt text"

  # You can create a language based menu
    [languages.en.menu]
      [[languages.en.menu.main]]
        identifier = "about"
        name = "About"
        url = "/about"
      [[languages.en.menu.main]]
        identifier = "showcase"
        name = "Showcase"
        url = "/showcase"

# And you can even create generic menu
[menu]
  [[menu.main]]
    identifier = "about"
    name       = "About"
    url        = "/about"
  [[menu.main]]
    identifier = "blog"
    name       = "Blog"
    url        = "/posts"
```

## How to run your site

From your Hugo root directory run:

```bash
hugo server -t hello-friendly
```

and go to `localhost:1313` in your browser. From now on all the changes you make will go live, so you don't need to refresh your browser every single time.

## How to edit the theme

If you really want to edit the theme, you need to install Node dependencies. To do this, go to the theme directory (from your Hugo root directory):

```bash
cd themes/hello-friendly
```

and then run:

```bash
npm install
```

## How to contribute

If you spot any bugs, please use [Issue Tracker](https://github.com/niklas-heer/hugo-theme-hello-friendly/issues) or if you want to add a new feature directly please create a new [Pull Request](https://github.com/rhazdon/hugo-theme-hello-friendly/pulls).

## Third Party

- [normalize.css](https://github.com/necolas/normalize.css)
- [Feather Open Source Icons](https://github.com/feathericons/feather)
- [Flag Icon](https://github.com/lipis/flag-icon-css)

## Licence

Copyright © 2019 Niklas Heer

The theme is released under the MIT License. Check the [original theme license](https://github.com/niklas-heer/hugo-theme-hello-friendly/blob/master/LICENSE.md) for additional licensing information.
