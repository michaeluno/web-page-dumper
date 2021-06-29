# Web Page Dumper
Dumps web page outputs including JavaScript generated contents.

<p align="center">
  <img src="assets/image/screenshot.jpg" width="600" alt="Web Page Dumper" title="screenshot"> 
</p>

## Demo
Visit [here](https://web-page-dumper.herokuapp.com/). If the server is sleeping, it takes several seconds to wake up. 

## Usage

Access the app address following the path `/www/` with query parameters of the GET or POST method. 

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fexample.org
```

### Query Parameters

Only the `url` parameter is required. The rest is optional. 

For boolean values, use `1` or `0` instead of `true` or `false`.

#### (required, string) `url`
A _URL-encoded_ URL to fetch. 

> Note: It is important to pass an URL-encoded value especially when the URL includes query parameters not to mix with the current parameters and the requested URL parameters.   

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgithub.com%2F
```


#### (string) `output`
The output type. Accepts the following values:
- `json` (default) - outputs the site source code, the HTTP header, the HTTP status code, and content type as JSON with the following root keys: 
  - `url` - (string) the requested URL.
  - `query` - (array) the HTTP request query key-value pairs.
  - `resourceType` - (string) the request source type.
  - `contentType` - (string) the HTTP response content type, same as the HTTP header `Content-Type` entry.
  - `status` - (integer) the HTTP status code as a number such as `200` and `404`.
  - `heaers` - (array) the HTTP header.
  - `body`   - (string) the HTTP body, usually an HTML document.
- `html`, `htm` - outputs the site source as `html` or `htm`. HTTP header will be omitted.
- `mhtml` - outputs the site source as `mhtml`.
- `png`, `jpg`, `jpeg` - outputs a screenthot image of the site
- `pdf`

#### (array) `viewport`

Sets how the browser should be viewed.

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fwww.google.com&output=jpg&set_viewport=1&viewport[width]=800&viewpor[height]=1200&viewport[deviceScaleFactor]=5
```
 
Accepts the following arguments, same as Puppeteer's `page.setViewport()` method arguments.
 
>  - `width` (number) page width in pixels.
>  - `height` (number) page height in pixels.
>  - `deviceScaleFactor` (number) Specify device scale factor (can be thought of as dpr). Defaults to `1`.
>  - `isMobile` (boolean) Whether the `meta viewport` tag is taken into account. Defaults to `false`.
>  - `isLandscape` (boolean) Specifies if viewport is in landscape mode. Defaults to `false`.
>  
> -- [Puppeteer API Tip-Of-Tree page.setViewport(viewport)][1]

[1]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagesetviewportviewport

Does not accept the following arguments.

- `hasTouch`

#### (array) `screenshot`

Sets screenshot options. This takes effect when the `output` parameter is either of `jpg`, `jpeg`, `png`, or `gif`. 

e.g. 
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgithub.com%2F&output=jpg&screenshot[quality]=10&screenshot[omitBackground]=1
```
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgoogle.com%2F&output=png&screenshot[clip][x]=50&screenshot[clip][y]=80&screenshot[clip][width]=700&screenshot[clip][height]=200
```

Accepts the following arguments, same as Puppeteer's `page.setViewport()` method arguments.
  
>  - `quality` (number) The quality of the image, between 0-100. Not applicable to `png` images.
>  - `clip` (object) An object which specifies clipping region of the page. Should have the following fields:
>    - `x` (number) x-coordinate of top-left corner of clip area
>    - `y` (number) y-coordinate of top-left corner of clip area
>    - `width` (number) width of clipping area
>    - `height` (number) height of clipping area
>  - `omitBackground` (boolean) Hides default white background and allows capturing screenshots with transparency. Defaults to `false`.
> 
> -- [Puppeteer API Tip-Of-Tree page.screenshot([options])][2]

[2]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagescreenshotoptions

Does not accept the following arguments.

- `path`
- `encoding`
- `type`
- `fullPage` - when the `clip` argument is not set, the full page screenshot will be taken.  

#### (integer) `reload`  
Specifies whether to reload the internal browser. This is useful for cookie dependant web sites.  

Accepts `1` or `0`.

#### (integer) `cache`
Decides whether to use browser caches.

Accepts `1` or `0`.

#### (integer) `timeout`
The browser connection timeout in milliseconds.

Default: `30000`.

#### (string) `user_agent`
Specifies a user agent.

#### (string) `username`
For a site that requires a basic authentication, set a user name with this parameter.

#### (string) `password`
For a site that requires a basic authentication, set a password with this parameter.

#### (array) `pdf`
When the output type is set to `pdf`, the following sub-arguments of the `pdf` parameter is accepted. 

For more details please see [puppeteer's pdf options](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions) as the arguments are the same except some unsupported arguments. 

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgithub.com&output=pdf&pdf[scale]=0.5&pdf[printBackground]=1&pdf[pageRanges]=1-3&pdf[format]=Legal
```

##### Accepted Arguments  

>  - `scale` (number) Scale of the webpage rendering. Defaults to `1`. Scale amount must be between 0.1 and 2.
>  - `displayHeaderFooter` (boolean) Display header and footer. Defaults to `false`.
>  - `headerTemplate` (string) HTML template for the print header. Should be valid HTML markup with following classes used to inject printing values into them:
>    - `date` formatted print date
>    - `title` document title
>    - `url` document location
>    - `pageNumber` current page number
>    - `totalPages` total pages in the document
>  - `footerTemplate` (string) HTML template for the print footer. Should use the same format as the `headerTemplate`.
>  - `printBackground` (boolean) Print background graphics. Defaults to `false`.
>  - `landscape` (boolean) Paper orientation. Defaults to `false`.
>  - `pageRanges` (string) Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
>  - `format` (string) Paper format. If set, takes priority over `width` or `height` options. Defaults to 'Letter'. Accepts the following values.
>    - `Letter`: 8.5in x 11in
>    - `Legal`: 8.5in x 14in
>    - `Tabloid`: 11in x 17in
>    - `Ledger`: 17in x 11in
>    - `A0`: 33.1in x 46.8in
>    - `A1`: 23.4in x 33.1in
>    - `A2`: 16.54in x 23.4in
>    - `A3`: 11.7in x 16.54in
>    - `A4`: 8.27in x 11.7in
>    - `A5`: 5.83in x 8.27in
>    - `A6`: 4.13in x 5.83in  
>  - `width` (string|number) Paper width, accepts values labeled with units.
>  - `height` (string|number) Paper height, accepts values labeled with units.
>  - `margin` (object) Paper margins, defaults to none.
>    - `top` (string|number) Top margin, accepts values labeled with units.
>    - `right` (string|number) Right margin, accepts values labeled with units.
>    - `bottom` (string|number) Bottom margin, accepts values labeled with units.
>    - `left` (string|number) Left margin, accepts values labeled with units.
>  - `preferCSSPageSize` (boolean) Give any CSS `@page` size declared in the page priority over what is declared in `width` and `height` or `format` options. Defaults to `false`, which will scale the content to fit the paper size.
>
> The `width`, `height`, and `margin` options accept values labeled with units. Unlabeled values are treated as pixels.
> 
> All possible units are:
>  - `px` - pixel
>  - `in` - inch
>  - `cm` - centimeter
>  - `mm` - millimeter
>
> -- [Puppeteer API Tip-Of-Tree page([options])][3]

[3]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions

##### Unsupported Arguments
  - `path` (string) 

#### (array) `headers`
Additional HTTP headers sent to the page.

```
http(s)://{app address}/www/?url=https%3A%2F%2Fgoogle.com%2F&output=jpg&headers[Accept-Language]=en&headers[dnt]=1
```

#### (array) `args`

The `args` argument for the `puppeteer.launch()` method. For accepted arguments, please see [here](https://peter.sh/experiments/chromium-command-line-switches/).

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgoogle.com%2F&output=jpg&args[]=--lang=en-GB
```

#### (string) `proxy`

Format: `scheme://username:password@ipaddress:port`

For example, to set `socks4://127.0.0.1:1080`,

```
http(s)://{app address}/www/?url=https%3A%2F%2Fwww.google.com&output=png&proxy=socks4%3A%2F%2F127.0.0.1:1080
```

#### (array) `block`
Blocks specified resources. This has the following sub argument keys.
- types
- urls

##### (array) `types` 
Specifies the types to block.

Accepted values:
- `image`
- `stylesheet`
- `font`
- `script` 

By default, when the output type is `html' or `json`, and no `block` value is passed, `image`, `stylesheet`, and `font` are added by default.  

```
http(s)://{app address}/www/?url=https%3A%2F%2Fwww.amazon.com%2Fgp%2Fgoldbox&output=png&block[types][]=script
```

##### (array) `urls`
Specifies the part of URLs to block. Use asterisk (`*`) to match any characters.

Such as: 
- `*.optimizely.com`
- `googleadservices.com`

```
http(s)://{app address}/www/?url=https%3A%2F%2Fwww.amazon.com%2Fgp%2Fgoldbox&output=png&block[urls][]=googleadservices.com
```

#### (string|array) `waituntil`
Determines when Puppeteer decides the page is fully loaded. The same as the `waitUntil` parameter of the `goto()` page method.. Accepted values are `load`, `domcontentloaded`, `networkidle0`, and `networkidle2`. 

Default: `load`.

>  - `load` - consider navigation to be finished when the load event is fired.
>  - `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
>  - `networkidle0` - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
>  - `networkidle2` - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
>
> -- [Puppeteer API Tip-Of-Tree page([options])][4]

[4]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagegotourl-options

### Logging

#### Enabling Log Pages
To enable the access to the app's log, you need to set an environment variable of `LOG_ROUTE` with a value serving as the root name (part of URL path). 

There are mainly two options: 

- **a)** Create a file named `.env` with the following entry in the project root directory (the same location as app.js).

```
#LOGGING
LOG_ROUTE=log
```

- **b)** On Heroku, go to _**Dashboard**_ -> _(Choose your App)_ -> _**Settings**_ -> _**Config Vars**_ and add `LOG_ROUTE` with a value such as `log`.

In the above examples, `log` is used for the route name. You can set your desired name. 

#### Log Pages
There are four log types available, which are, `request`, `browser`, `debug` and `error`. Say, the route name is `log`, then the following pages will be available.

##### request
Logs HTTP requests. 

```
https://{your-app-name}.herokuapp.com/{log route}/request/{YYYY-MM-DD}
```

Example:
```
https://web-page-dumper.herokuapp.com/log/request/2021-06-27
```


##### browser
Logs browser activities.

```
https://{your-app-name}.herokuapp.com/{log route}/browser/{YYYY-MM-DD}
```

Example:
```
https://web-page-dumper.herokuapp.com/log/browser/2021-06-27
```

##### debug
Logs debug information.

```
https://{your-app-name}.herokuapp.com/{log route}/debug/{YYYY-MM-DD}
```

Example:
```
https://web-page-dumper.herokuapp.com/log/debug/2021-06-27
```

##### error
```
https://{your-app-name}.herokuapp.com/{log route}/error/{YYYY-MM-DD}
```

Example:
```
https://web-page-dumper.herokuapp.com/log/error/2021-06-27
```

## Deployment to Heroku
This web application is meant to run on [Heroku](https://www.heroku.com/). 

1. Log in to Heroku. If you don't have an account create a [Heroku account](https://id.heroku.com/).
2. Click [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/michaeluno/web-page-dumper)
3. In the following page, enter your desired app name and press the `Deploy App` button which will start deploying.
4. After finishing the deployment, click on `Manage App`.
5. In the following page, click on `Open App`.   

### Buildpack
If you get the following error,

```
error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

You need to manually add the following buildpack through the Heroku UI (Dashboard -> {Your App} -> Settings -> Buildpacks).

- https://github.com/CoffeeAndCode/puppeteer-heroku-buildpack.git
 

## License
MIT