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

#### (required, string) url 
A URL-encoded URL to fetch. 

e.g.
```
http(s)://{app address}/www/?url=https%3A%2F%2Fgithub.com
```

#### (string) output
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
- `png`, `jpg`, `jpeg`, `gif` - outputs a screenthot image of the site
- `pdf`

#### (integer) vpw
Sets a browser viewport width. Use this to simulate a browser. 

#### (integer) vph
Sets a browser viewport height. Use this to simulate a browser.
 
#### (integer) ssw
Sets a width of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.  
 
#### (integer) ssh 
Sets a height of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.

#### (integer) ssx
Sets an X coordinate offset for a screenshot.

#### (integer) ssy 
Sets an Y coordinate offset for a screenshot. 

#### (integer) reload  
Specifies whether to reload the internal browser. This is useful for cookie dependant web sites.  

Accepts `1` or `0`.

#### (integer) cache
Decides whether to use browser caches.

Accepts `1` or `0`.

#### (integer) timeout
The browser connection timeout in milliseconds.

Default: `30000`.

#### (string) user_agent
Specifies a user agent.

## License
MIT