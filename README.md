# Web Page Dumper
Dumps web site contents.

## Usage

Access the app address following the path `/www/` with query parameters of the GET or POST method. 

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fexample.com
```

### Query Parameters

Only the `url` parameter is required. The rest is optional. 

For boolean values, use `1` or `0' instead of `true` or `false`.

#### <required, string> `url`
A URL-encoded URL to fetch. 

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgithub.com
```

#### <string> `output`
The output type. Accepts the following values:
- `json` (default) - outputs the site source code, the HTTP header, the HTTP status code, and content type as JSON with the following root keys: 
  - `url` - <string> the requested URL.
  - `query` - <array> the HTTP request query key-value pairs.
  - `resourceType` - <string> the request source type.
  - `contentType` - <string> the HTTP response content type, same as the HTTP header `Content-Type` entry.
  - `status` - <integer> the HTTP status code as a number such as `200` and `404`.
  - `heaers` - <array> the HTTP header.
  - `body`   - <string> the HTTP body, usually an HTML document.
  
- `html`, `htm` - outputs the site source as `html` or `htm`. HTTP header will be omitted.
- `mhtml` - outputs the site source as `mhtml`.
- `png`, `jpg`, `jpeg`, `gif` - outputs a screenthot image of the site
- `pdf`

#### <array> `viewport`

Sets how the browser should be viewed.

e.g.
```
```
 
Accepts the following arguments, same as Puppeteer's `page.setViewport()` method arguments.
 
>  - `width` <number> page width in pixels.
>  - `height` <number> page height in pixels.
>  - `deviceScaleFactor` <number> Specify device scale factor (can be thought of as dpr). Defaults to `1`.
>  - `isMobile` <boolean> Whether the `meta viewport` tag is taken into account. Defaults to `false`.
>  - `isLandscape` <boolean> Specifies if viewport is in landscape mode. Defaults to `false`.
>  
> -- [Puppeteer API Tip-Of-Tree page.setViewport(viewport)][1]

[1]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagesetviewportviewport

Does not accept the following arguments.

- `hasTouch`

#### <integer> vpw
Sets a browser viewport width. Use this to simulate a browser. 

#### <integer> vph
Sets a browser viewport height. Use this to simulate a browser.
 
#### <integer> ssw
Sets a width of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.  
 
#### <integer> ssh 
Sets a height of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.

#### <integer> ssx
Sets an X coordinate offset for a screenshot.

#### <integer> ssy 
Sets an Y coordinate offset for a screenshot. 

#### <integer> reload  
Specifies whether to reload the internal browser. This is useful for cookie dependant web sites.  

Accepts `1` or `0`.

#### <integer> cache
Decides whether to use browser caches.

Accepts `1` or `0`.

#### <integer> timeout
The browser connection timeout in milliseconds.

Default: `30000`.

#### <string> user_agent
Specifies a user agent.

#### <string> username
For a site that requires a basic authentication, set a user name with this parameter.

#### <string> password
For a site that requires a basic authentication, set a password with this parameter.

#### <array> pdf
When the output type is set to `pdf`, the following sub-arguments of the `pdf` parameter is accepted. 

For more details please see [puppeteer's pdf options](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions) as the arguments are the same except some unsupported arguments. 

e.g.
```
```

##### Accepted Arguments  

>  - `scale` <number> Scale of the webpage rendering. Defaults to `1`. Scale amount must be between 0.1 and 2.
>  - `displayHeaderFooter` <boolean> Display header and footer. Defaults to `false`.
>  - `headerTemplate` <string> HTML template for the print header. Should be valid HTML markup with following classes used to inject printing values into them:
>    - `date` formatted print date
>    - `title` document title
>    - `url` document location
>    - `pageNumber` current page number
>    - `totalPages` total pages in the document
>  - `footerTemplate` <string> HTML template for the print footer. Should use the same format as the `headerTemplate`.
>  - `printBackground` <boolean> Print background graphics. Defaults to `false`.
>  - `landscape` <boolean> Paper orientation. Defaults to `false`.
>  - `pageRanges` <string> Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
>  - `format` <string] Paper format. If set, takes priority over `width` or `height` options. Defaults to 'Letter'. Accepts the following values.
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
>  - `width` <string|number> Paper width, accepts values labeled with units.
>  - `height` <string|number> Paper height, accepts values labeled with units.
>  - `margin` <Object> Paper margins, defaults to none.
>    - `top` <string|number> Top margin, accepts values labeled with units.
>    - `right` <string|number> Right margin, accepts values labeled with units.
>    - `bottom` <string|number> Bottom margin, accepts values labeled with units.
>    - `left` <string|number> Left margin, accepts values labeled with units.
>  - `preferCSSPageSize` <boolean> Give any CSS `@page` size declared in the page priority over what is declared in `width` and `height` or `format` options. Defaults to `false`, which will scale the content to fit the paper size.
>
> The `width`, `height`, and `margin` options accept values labeled with units. Unlabeled values are treated as pixels.
> 
> All possible units are:
> - `px` - pixel
> - `in` - inch
> - `cm` - centimeter
> - `mm` - millimeter
>
> -- [Puppeteer API Tip-Of-Tree page.pdf([options])][2]

[2]: https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions

##### Unsupported Arguments
  - `path` <string> 


## License
MIT