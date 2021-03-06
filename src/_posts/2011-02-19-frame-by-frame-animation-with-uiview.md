---
layout: post
title: Frame-by-frame animation with UIView
---

Sometimes the built-in animation curves in UIView (or Core Animation for that matter) just don't cut it.

You want to animate a bouncy ball with (somewhat) realistic physics, or just need to use an <a href="http://iphonedevelopment.blogspot.com/2010/12/more-animation-curves-than-you-can.html">animation curve</a> that's not ease-in, ease-out, ease-in/out, or linear. But writing a bunch of boilerplate code for setting up your CAKeyframeAnimations can really bog down the flow of your UI code.

Never fear, grab UIView+ExplicitAnimation from <a href="https://github.com/darknoon/UIView-Explicit-Animation">the repo on github</a>.

<a href="images/old/2011/02/simulator.png"><img src="images/old/2011/02/simulator-212x400.png" alt="" title="simulator" width="212" height="400" class="aligncenter size-medium wp-image-128" /></a>

Here's the relevant code for the demo:

```objc
CGPoint startCenter = ((CALayer *)[bouncyView.layer presentationLayer]).position;
CGPoint endCenter = bouncyViewCenter;

//Scope for variables in physics simulation
__block double v = -402;
__block double p = startCenter.y;
double elasticity = 0.7;
double g = 1080;
//Add an additional second for each 100 pixel of height we have
double duration = 2.0 + 0.01 * (endCenter.y - startCenter.y);

[UIView animateExplicitlyWithDuration:duration
                            frameRate:30.0
                           animations:^(double t, double dt) {
	DNUIViewExplicitAnimationProxy *objectProxy = [bouncyView explicitFrameProxy];
	DNUIViewExplicitAnimationProxy *shadowProxy = [shadowView explicitFrameProxy];

	//Physics simulation here :)
	//If we would surpass the target location, bounce instead
	if (p + dt * v &gt; endCenter.y) {
		v = -elasticity * v;
		p = endCenter.y;
	} else {
		v += g * dt;
		p += dt * v;
	}
	objectProxy.alpha = 1.0 + 0.5 * sin(0.1 * t);
	objectProxy.center = (CGPoint) {.x = endCenter.x, .y = p};

	double d = endCenter.y - p;
	shadowProxy.alpha = 0.8 / (1.0 + 0.01 * d);
	shadowProxy.transform = CGAffineTransformMakeScale(1.0 + 0.005 * d,
	                                                   1.0 + 0.005 * d);
}];
```

Note how simple it is and there's no boilerplate boxing/unboxing of floats or CGPoints.

I decided on the objectProxy business instead of swizzling <code>-[UIView actionForLayer:forKey:</code> to get the changes you want in the value of alpha or center or what have you. If you're less timid about swizzling, the proxy business could be eliminated.

```

```
