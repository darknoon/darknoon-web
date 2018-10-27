---
layout: post
title: Peeking into iPhone Apps
---

Ever seen an interesting effect in a third party app and wondered how it worked? Want to check out how another app stores its resources? Here's the step-by-step on how to go about doing it.

I assume you have at least a little experience with the Terminal and that you're running Mac OS X 10.5.

Here's how to take apart an iPhone app and look at its resources:

1. Right-click the application icon in iTunes > select "Show in Finder"

1. Copy the .ipa file to a new location

1. Change the file extension to .zip

1. Unarchive the zip, and you'll get a directory of files

1. Take the App bundle from the "Payload" directory and use Get Info to remove the .app extension

Okay, now you can see all of the resources in the App bundle, but if you want to view any PNGs, you're still out of luck. In the build process for an iPhone app, Xcode goes through and converts any PNGs into a special format. To change them back to standard PNGs that you can open in Preview or other apps, you'll need to <a href="http://www.modmyiphone.com/wiki/index.php/Iphone_PNG_images">normalize your PNGs</a>. I decided to go with the <a href="http://www.axelbrz.com.ar/?mod=iphone-png-images-normalizer">Python-based code</a> for simplicity. The following assumes you use it as well:

1. Save the python code to somewhere convenient

1. Open a Terminal window

1. `cd` into the application directory (the former .app bundle), as the script will normalize all PNGs in the current working directory or its subdirectories.

1. Type `python <path to python script>`

1. There will be a prompt; type `Y` for yes and hit `enter`. The script will now convert your PNGs!

This process can be useful if you're curious about how some app works; sometimes you can get a good idea just from looking at its resources.

In a future post, I'll detail some of my observations from peeking into other developers' work.
