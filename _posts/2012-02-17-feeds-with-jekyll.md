---
layout: post
title: Adding Feeds with Jekyll
---

I'm loving not worrying about my blog getting hacked, though I haven't had a lot of time to turn these ideas for posts into actual published material.

But so far my site didn't have any idea about feeds. Static html pages are generated, but there is no way to subscribe.

I was contacted by someone who wanted to subscribe via RSS, so I thought I'd figure out how to make feeds work nicely with a static Jekyll site. I added a directory `/feeds` to my Jekyll directory with a couple of pages in there to generate the XML files for Atom and RSS feeds.

I used a slightly modified version of [these templates](http://coyled.com/2010/07/05/jekyll-templates-for-atom-rss/) to generate the feeds.

You can see the small amount of work I did to support feeds on [github](https://github.com/darknoon/darknoon.com/commit/88ea154f9e5349b700e9f0b7c702a0b7f8c7b679).
