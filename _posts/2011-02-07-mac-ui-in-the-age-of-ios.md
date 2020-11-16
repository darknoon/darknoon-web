---
layout: post
title: Mac UI in the Age of iOS
---

<!-- <img style="display: block; margin-left: auto; margin-right: auto;" title="Compare.png" src="/images/old/2011/02/Compare.png" border="0" alt="Compare.png" width="278" height="168" /> -->

In the era of iOS, how will Mac applications adapt to changing expectations about UI design? The launch of the Mac App Store might be the turning point in what we expect Mac apps to do and look like. Is AppKit still up to the task?

While the Mac App Store is just a platform for distribution and no iPhone APIs are included with the SDK, its opening signals a change in the status quo of Mac software. While lots of long-time (heh, at least as long as it's been around) iOS developers are content to stay on the iPhone/iPod touch/iPad platforms, there is renewed interest in the Mac as well, especially among game developers, since it's easier to port OpenGL from iOS to Mac (see Angry Birds) than UIKit apps to AppKit.

The App Store on iOS is well known for its selection of highly-animated, beautifully-designed, interactive, inexpensive ($1—$5 is typical), and popular applications purchased with a couple taps. In contrast, the Mac has been known for more expensive and functionally-oriented applications that typically include lots of preferences, advanced features, and a more consistent UI, offered for prices more in the $10-$60 range on 3rd party websites.

###Twitter for Mac

Twitter for Mac (aka Tweetie 2) is in many respects, a bridge connecting the incredible and rapid progress made designing and developing for iOS during the last two years and the somewhat sleepier kingdom of the Mac. It features a fully animated, custom, slick UI.

<img title="Twitter.png" src="/images/old/2011/02/Twitter.png" border="0" alt="Twitter for Mac" width="504" height="403" />

In what ways does it bridge the gap? Take a look:

Just about everything in Twitter for Mac is animated, including new views sliding in from the side, pop-ups for linked images, lists slipping away out of sight when changing views, the pulsing progress animations, and mouse-overs. The Cancel/Send buttons at the bottom of the compose window are found in an UIKit-like toolbar. Tables are full-width and single-column, beside which the scroll indicator takes the iOS pill shape. When scrolling happens in these lists, it decelerates exponentially akin to iOS. Heck, we even see Helvetica in there. Must be an iOS app, right?

Well, what about the influences from the Mac, like full support for keyboard navigation, gestures, and scroll wheels. There are standard(-ish) close, minimise, maximise buttons in upper left of window. The standard Command-Q and Command-N shortcuts are provided, along with a variety of app-specific keyboard commands like Command-T to view on twitter.com. Twitter for Mac even includes Applescripting support. So, this is a pretty "Mac-Like" app with a lot of consideration for the platform at hand, unlike applications written in cross-platform frameworks like flash/AIR or Java.

So, why even consider its iOS influences; isn't it just a modern AppKit app that uses Core Animation to create a nice-looking UI.

Yes, and no. See, there is something interesting lurking inside Twitter for Mac more fundamentally iOS-insipired than your typical Mac app: UIKit.

###ABUIKit

Based on a <a href="http://twitter.com/lorenb/status/10878750036066304">one-off tweet</a> from Loren Brichter, Twitter for Mac's developer, I started to do a bit of investigating. Here's an excerpt from the output of <a href="http://www.codethecode.com/projects/class-dump/">class-dump</a> (edited for brevity):

```objc
@interface ABUIView : ABUIResponder {
CALayer \*\_layer;
long long \_tag;
...
}

- (id)initWithFrame:(struct CGRect)arg1;

@property(readonly, retain, nonatomic) CALayer \*layer;

@property(copy, nonatomic) NSArray \*subviews;
...
@end
```

ABUIResponder inherits from NSResponder, in case you're wondering, which essentially means that it can play with the event handling part of the Mac APIs, but is _not_ an NSView, ie AppKit. So basically, Twitter for Mac doesn't use AppKit. Obviously it doesn't actually use UIKit either, seeing as Apple hasn't seen to port it to Mac OS, but it seems to be using a custom framework called ABUIKit that implements equivalents of the convenient classes on iOS that fall under the UIKit framework. There are some acknowledgements of the Mac environment it lives in such as flags for whether views resize or drag the window they're in, among other things.

Digging into implementation of Twitter for Mac, I saw these key UIKit classes and more:

- <code>UIView</code>
- <code>UIViewController</code>
- <code>UIButton</code>
- <code>UIColor</code>
- <code>UIFont</code>
- <code>UIScrollView</code>
- <code>UITableView</code>
- <code>UIImage</code> including stretchable images
- <code>UILabel</code>
- <code>UIImageView</code>
- <code>UIView</code> animations
- ...

All of these items contain functionality that is very simple on iOS, but can be complicated to implement on the Mac. Now, Loren isn't the only one to attempt to write some sort of compatibility layer between the iOS APIs for the Mac. I talked to [@enormego](http://twitter.com/enormego) while investigating this article, who wrote [a collection of classes under the name UIKit](https://github.com/enormego/UIKit) that implement some level of convenience on top of NSView and offer a UILabel and UITableView among other convenience classes, but fundamentally this is still AppKit.

Ok, sure, why wouldn't it make sense to implement UIKit as a minimal extension on top of AppKit, right? NSViews can have Core Animation layers, so they should be somewhat interchangeable with their iOS equivalents. Turns out there are some limitations and some reasons it's less attractive than it might seem.

###AppKit + CALayer

The APIs now known as AppKit originated at NeXT as part of the NeXTSTEP operating system. The original NeXT computer in 1989 drove a 17" 1120 by 832 display off of 8-64 mb of ram and a 25mhz processor. Driving such a large display necessitated being parsimonious with screen updates. The approach that AppKit takes is to avoid updating the whole screen at once. Instead, updates are restricted to the set of rectangles containing changed content.

That's great for simple text changes, but it creates a problem when you try to animate an item on screen, say its position or opacity. The entire item needs to be redrawn, because its appearance has changed, even if the actual _content_ hasn't changed. Thus, if everything is redrawn on the CPU, you're incurring a potentially expensive drawing operation many times per second. Consequently the computer might not be able to keep up and the animation framerate suffers.

When Apple was designing an operating system for the iPhone, they were well aware of this limitation and knew that they would be fighting an uphill battle to get the Mac OS X APIs for drawing to perform well on a mobile phone when the design called for multiple views animating, shrinking and fading simultaneously.

So, they decided to completely ditch AppKit and do something different: each view, instead of an arbitrary region on screen that knows how to draw itself, would have an image of its content. Each view would contain different subviews that each may or may not have its own content image. When one of the subviews updates, it would only update its own image (thus ensuring unnecessary drawing is avoided). When an app would need to fade out a view, its opacity attribute would be modified, but the contents of the image would be static. This is called a scene-graph, or in the parlance of the framework they created, a layer graph.

In case you haven't guessed, this framework is called Core Animation, and it forms the basis for UIKit on iOS. The GPU (via OpenGL ES) gets to handle all of simple but repetitive drawing bits in compositing the layer graph to the screen, while the CPU focuses on complicated drawing like text and gradients. This division of labor works so well at that when the engineers at RIM saw the original iPhone, they thought Apple was lying about its battery life. In reality, they're not doing that much drawing on the CPU, instead getting nice animated effects essentially for free by using the more efficient GPU.

Obviously, it's a good idea to save CPU cycles on an iPhone or iPad where you have a 1 GHz ARM processor, but what about on the Mac where you have a 2-, 4-, or more core intel processor running at over 2GHz? It turns out to still be useful, for a couple of reasons. It's hard to take advantage of any more than 1 CPU core for drawing, because it's generally synced with the main UI thread and thus can only take advantage of one CPU core. Writing multi-threaded drawing code is hard, but fortunately Core Animation helps out by keeping all of the hard drawing on the main thread where it's synced with application logic, and then offloading animation to a background high-performance thread. Furthermore, Core Animation implements a lot of drawing implicity akin to CSS on the web. Just set the border property and boom, you have a border, set the mask and you have a mask—no need to add a bunch of drawing code wherever you have a rounded corner.

UIKit's most fundamental display class, UIView, is built very thinly on top of Core Animation's CALayer class. Thus on the iPhone, changes to properties like position, opacity, background color, etc are extremely efficient. After Apple created Core Animation for the iPhone, knowing its general usefulness to increase efficiency and eliminate the custom GL code that developers used to accelerate 3d transitions and tie different graphics systems together, they set about porting it back to the Mac.

However, the implementation of NSView couldn't be changed completely. All of the existing applications (and even much of AppKit itself) relies on the redraw rect model. `NSTableView` in particular is ill-suited to layer backing, as it is predicated on the model of redrawing small sections using reusable "rubber-stamp" bits that are subclasses of `NSCell`.

The approach they took with Mac OS X 10.5 was two-fold. Developers have the following options:

-Keep the previous (pre-10.5) behavior (this is the default)

-Turn the view into a "layer-backed" view. Developers are instructed not to interact directly with the CALayer; drawing should happen via the usual NSView routes.

-Turn the view into a "layer hosting" view. Developers are instructed not to add subviews to the NSView.

See <a href="http://developer.apple.com/library/mac/documentation/Cocoa/Reference/ApplicationKit/Classes/NSView_Class/Reference/NSView.html#//apple_ref/occ/instm/NSView/setWantsLayer:">the documentation of the -setWantsLayer:</a> for more information. The summary: _both options suck_.

What are we left with? Well, it's still not pretty. NSView has a number of long-standing annoyances that were easily fixed when using the layer-based API on iOS, but aren't fixed with the "layer-backed" bolt-on solution: <a href="http://stackoverflow.com/questions/466297/is-there-a-proper-way-to-handle-overlapping-nsview-siblings">overlapping siblings</a>, background color, mixing 3d transforms with regular views, the , etc. You have to use `[[view animator] setFrame:frame]` instead of the much more elegant, functional, and less buggy UIView API `+beginAnimations` / `+commitAnimations` or the new block-based APIs like`+animateWithDuration:delay:options:animations:completion:`.

The other option is to use the "layer hosting" option and set a root layer in your view and then use CALayers exclusively to make your interface. Great! All of the benefits of Core Animation, with none of the legacy of NSView, right? Sounds good, but CALayers are somewhat tricky to use in this fashion, which is why on iOS they are wrapped by UIView. I couldn't come up with a strictly prohibitive reason, but you can't make your layers inherit from NSResponder, so you'd have to implement your own responder chain, and the UIView approach works so well that I don't see any reason not to use it.

So, how does ABUIKit do it? To display on screen, it needs to play at least a little bit with the existing AppKit API, so it goes the "layer-hosting" route and then provides its own view hierarchy thereupon.

###Where do we go from here?

I've done a bit of messing around with a fork of a fork by [@jasoncmartin](http://twitter.com/jasoncmartin) of [@enormego](http://twitter.com/enormego) 's UIKit framework. I've tried to divorce it as much as possible from the tyranny of AppKit, rewriting lots of it as I go along.

- UIView now inherits from NSResponder and not NSView
- UIView supports background colors natively
- View coordinates are flipped vs AppKit
- UIScrollView handles everything itself instead of being based on NSScrollView
- etc.

I've learned a ton about the implementation of UIKit from working on this clone. I have to say, if you ever want to really learn about your favorite framework, copying is the most serious and intimate form of flattery.

I made a little example app to show off the framework. It downloads tweets matching a certain search query and shows them in a UITableView clone. I made a really simple button thingy to make it refresh and test event handling.

This work is still just _messing-around quality_. Basically, it would require a huge amount of work to make this into a framework that could actually be used to build shippable Mac apps. This could happen, but phew, the more I try to make this work, the more I have a huge respect for Loren's work here. I'll call this "Option 1."

The source and my simple example app are <a href="github.com/darknoon/UIKit">on github</a>.

<strike>
<h3>Option 2: Petition twitter to release ABUIKit</h3>

Since Loren's company atebits was acquired by twitter, it's up to those guys to decide whether to release it. Code releases are typically harder than just dumping it up on github, so it's important to show the people at Twitter the value in terms of goodwill and community support they would get for releasing it in exchange for the engineer time they would have to devote.

To do your part, tweet with the tag #ABUIKit to send a message to Twitter HQ that an open-source alternative to AppKit on the Mac matters, and to add your voice!
</strike>

<div class="updated">
<h3>Update: Iconfactory releases "Chameleon"</h3>

This is the implementation of a very closely-drawn UIKit clone for mac, with good text support. It's shipping in Twitterrific for mac.

Looks pretty good, but it seems their initial expectations of everyone suddenly chipping in were a bit unrealistic. I'm still excited about its availability, though, and hope it has a good future.

Sean Harber and Craig Hockenberry detail the project on [chameleonproject.org](http://chameleonproject.org/). There is a nice video available there to watch and an overview of how it works.

###Update: Twitter responds by open-sourcing ABUIKit as "TWUI"

This is really awesome, and a lot of thanks go to Loren for working with the twitter folks to get this code released. He gave great presentation at Twitter HQ during WWDC about the new framework and why you might use it. w00t!

Instead of poking around with <code>class-dump</code>, we can look at and use [the code](https://github.com/twitter/twui) directly.

###Update 2018: Marzipan
Apple ported [UIKit to macOS](https://www.imore.com/mac-app-evolution-bringing-uikit-macos) as "Marzipan" in 10.14 "Mojave", but it's pretty limited and not for truly native macOS apps (yet?).

</div>
