---
layout: post
title: Vector Math with C++ and GLKit
---

If you do a lot of graphics development, you're sure to use lots of vector math. A while ago I wrote some C++ extensions to Apple's [GLKit Math utilities](https://github.com/darknoon/GLKitMathCPP), but haven't had a chance to explain why they would be helpful, and how they can improve your graphics code.

So, say you have a simple numerical solver that keeps track of the position of a ball over time written in straight C or Objective-C. You might have some code that looks like this:

###Scalar math

```cpp
float ball_x, ball_y, ball_z;

...

ball*x = ball_x + change_x * dt;
ball*y = ball_y + change_y * dt;
ball_z = ball_z + change_z \* dt;
```

###Structs

That's a tad awkward, so defining a struct to contain x,y,z floats together makes a lot of sense:

```cpp
typedef struct {
  float x, y, z;
} vector3;

vector3 ball;

...

ball.x = ball.x + change.x _ dt;
ball.y = ball.y + change.y _ dt;
ball.z = ball.z + change.z * dt;
```

##Functions operating on structs

Well that's kind of better, but I want to do the same operation on every coordinate, and I don't want to keep peppering around these identical bits of code everywhere, so I'll define some convenience functions:

```cpp
typedef struct {
  float x,y,z;
} vector3;

vector3 ball;

vector3 mulVectorScalar(vector3 a, float k) {
  vector3 r;
  r.x = a.x _ k;
  r.y = a.y _ k;
  r.z = a.z \* k;
  return r;
}

vector3 addVector(vector3 a, vector3 b) {
  vector3 r;
  r.x = a.x + b.x;
  r.y = a.y + b.y;
  r.z = a.z + b.z;
  return r;
}

...

ball = addVector(ball, mulVectorScalar(b, dt))
```

We can even do some optimizations for the processor architecture that we're running on. For instance, ARMv7 (available on recent iOS devices) has a set of extensions called "NEON" that allow operations on multiple data simultaniously at a hardware level.

For iOS 5's new GLKit framework, Apple created a set of functions like our `addVector` that use NEON vector instructions to accelerate operations on vectors and matrices without having to pepper your own code with ifdefs.

From `<GLKit/GLKVector2.h>`:

```cpp
static inline GLKVector2 GLKVector2Add(GLKVector2 vectorLeft, GLKVector2 vectorRight)
{
#if defined(ARM_NEON)
  float32x2*t v = vadd_f32(*(float32x2*t *)&vectorLeft,
  _(float32x2_t _)&vectorRight);
  return _(GLKVector2 _)&v;
#else
  GLKVector2 v = { vectorLeft.v[0] + vectorRight.v[0],
  vectorLeft.v[1] + vectorRight.v[1] };
  return v;
#endif
}
```

The problem now is that these function names `addVector` and `mulVectorScalar` have taken the place of much more intuitive operators like `+` and `*`. Also, if we decide that the ball only needs to be a 2-element vector instead of a 3-element vector, we would need to switch all of the places where we update its position to new functions and new structs.

If we switch over to c++ land, we have a tool (operator overloading) that will let us have something both concise and efficient.

```cpp
#import "GLKMath_cpp.h"

GLKVector2 ball;

...

ball = ball + change \* dt;
```

This is implemented in [GLKVector2_cpp.h](https://github.com/darknoon/GLKitMathCPP/blob/master/Source/GLKVector2_cpp.h) as follows:

```cpp
#import <GLKit/GLKVector2.h>

...

inline GLKVector2 operator + (const GLKVector2& left, const GLKVector2& right) {
return GLKVector2Add(left, right);
}

inline GLKVector2 operator * (const float& left, const GLKVector2& right) {
return GLKVector2MultiplyScalar(right, left);
}

...
```

So, if you don't mind switching to c++, you can make your vector math a lot clearer to read (and hopefully reduce typos). If you notice anything amiss in with these headers or anything you think should be added, please create an issue or send a pull request [on github](https://github.com/darknoon/GLKitMathCPP)

<a href="https://github.com/darknoon/GLKitMathCPP"
   class="gitforked-button gitforked-forks gitforked-watchers">Fork on GitHub</a>
