# Change Log

#### 1.6.0
- Added the `cookies` parameter.
- Added the `version` route.

#### 1.5.1
- Optimized the logging criteria. 

#### 1.5.0
- Added the `action` parameter which allows the user to perform actions on the web page.
- Added the `waitUntil` parameter.
- Deprecated the `waituntil` parameter.

#### 1.4.1
- Added the `waituntil` parameter which accepts `load`, `domcontentloaded`, `networkidle2`, or `networkidle0`.  
- Optimized page load performance.

#### 1.4.0
- Added the ability to set a log route with an environment variable.
- Optimized for memory usage.

#### 1.3.2
- Updated dependencies for security.

#### 1.3.1
- Changed the browser to open at lease one instance always. 

#### 1.3.0
- Added the ability to log to files and display them.
- Added the `process` route.

#### 1.2.0
- Deprecated a custom location of user profile data.
- Optimized the response performance by closing the page after finishing the response.  
- Fixed a bug that reusing existing browsers was not handled properly, since 1.1.0. 

#### 1.1.0
- Added the `proxy` parameter.
- Fixed an issue that setting the `args` parameter did not take effect if a browser instance exists with previous requests.
- Fixed a bug that transferring cookies was partial.

#### 1.0.4
- Added support for Japanese, Korean and Chinese fonts.

#### 1.0.3 
- Fixed a bug that closing the browser was not handled properly.

#### 1.0.2
- Set a favicon.

#### 1.0.1
- Fixed a bug that when an empty value passed to the `quality` parameter, puppetter crashed.

#### 1.0.0
- Released.