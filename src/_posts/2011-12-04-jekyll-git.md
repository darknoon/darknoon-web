---
layout: post
title: Now Blogging with Jekyll
---

So, I had some issues with the previous wordpress-based site. It got hacked. Twice. It was hard to control the template and add new files onto the site. It wasn't very well versioned--I had a copy on my machine and one on the server, but editing posts in the web interface on the server meant I frequently didn't have a good backup of the current site. Plus, it needed a database (and resulting security concerns and administration annoyance). Finally, it was difficult to version it with git, my go-to these days for keeping track of changes and keeping everything safe.

So, with this in mind, I was looking for a setup that was dead-simple but didn't requre any copy-pasting of navigation headers, building blog index pages by hand, or anything similarly dumb.

I decided to go with [Jekyll](https://github.com/mojombo/jekyll), which takes files written in textile or markdown and applies a simple templating system, outputting a directory with a site full of static `.html` files. The web server can then be locked down quite intensely, as I don't need to be able to write any files or access any databases from the web user.

I can preview the site easily on my own machine with the built-in web server on the conversion tool. It will auto-regenerate the static pages when I make a change with the following options:

`jekyll --server --auto --pygments`

Of note:

- Navigation automatically detects the current page and puts the right css class on the links
- URLs match my old site

In case anyone would be interested in learning how I set up my server (on dreamhost) or built the site, I [pushed the source code up to github](https://github.com/darknoon/darknoon.com)

To deploy to my server, all I need to do is type `git push webserver master`, at which point a `post-recieve` script takes over in the server's git repo. This script checks out a working directory with the source files, then calls jekyll to generate the site into the web server's site directory.

My next step is to try to write a plugin to generate a nice gallery of some of the apps I've worked on. I'm also trying to decide what sort of paging scheme I want. I want to keep it as simple as possible so as not to spoil the elegance of navigation.
