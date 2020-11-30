# Web Page Dumper
Dumps web site contents.

## Usage

### Parameters

#### (string) url 
A URL-encoded URL to fetch. 

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

#### (integer) width
Sets a width of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.  
 
#### (integer) height 
Sets a height of the screenshot when the `type` argument is either of `png`, `jpg`, `jpeg`, or `gif`.

#### (integer) reload  
Specifies whether to reload the internal browser. This is useful for cookie dependant web sites.  

Accepts `1` or `0`.

#### (integer) cache_duration
Sets how long the cache should be retained.

## License
MIT
