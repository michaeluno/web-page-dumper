/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* nodejs-info() Extends nodeinfo()                            (c) Michael Uno 2020- MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// const nodeinfo = require( 'nodejs-info' );

'use strict';

const os   = require('os');   // nodejs.org/api/os.html
const http = require('http'); // nodejs.org/api/http.html
const fs   = require('fs');   // nodejs.org/api/fs.html
const { networkInterfaces } = require('os'); // for _getIP()

const handlebars       = require('handlebars');        // handlebars templating
const prettysize       = require('prettysize');        // convert bytes to other sizes
const humanizeDuration = require('humanize-duration'); // convert millisecond durations to English
const cookie           = require('cookie');            // cookie parsing and serialization

let packageJson = null;                                // inspect package.json from parent package;
try { packageJson = require('../package.json'); } catch (e) {}     // ignore it if not available
let dependenciesJson = null;
try { dependenciesJson = require('../package-lock.json'); } catch (e) {}     // ignore it if not available

const puppeteer = require( 'puppeteer' );
let puppeteerBrowserVersion = '';
(async () => {
  puppeteerBrowserVersion = await getPuppeteerBrowserVersion();
})();

// console.log( dependenciesJson );
const template = `<main>
    <h1>Node.js {{process.version}}</h1>
    {{#if package}}
    <table>        
        <thead>        
            <th colspan="2"><h2>Package</h2></th>
        </thead>
        <tbody>
            <tr><td>Name</td><td>{{package.name}}</td></tr>
            {{#if package.description}}
            <tr><td>Description</td><td>{{package.description}}</td></tr>
            {{/if}}
            <tr><td>Version</td><td>{{package.version}}</td></tr>
            {{#if package.dependencies}}
            <tr>
                <td>Dependencies</td>
                <td>
                    <ul>
                    {{#each package.dependencies}}
                        <li><span>{{@key}}</span>: <span>{{this}}</span></li>
                    {{/each}}
                    </ul>                
                </td>
            </tr>
            <tr>
                <td>Browser</td>                
                <td>{{puppeteerBrowserVersion}}</td>                
            </tr>
            {{/if}}
        </tbody>
    </table>
    {{/if}}
    <table>
        <thead>
            <th colspan="2"><h2>Server</h2></th>
        </thead>
        <tbody>
            <tr><td>hostname</td><td>{{os.hostname}}</td></tr>
            <tr><td>ip address</td><td>{{os.ip_address}}</td></tr>
            <tr><td>type</td><td>{{os.type}}</td></tr>
            <tr><td>platform</td><td>{{os.platform}}</td></tr>
            <tr><td>release</td><td>{{os.release}}</td></tr>
            <tr><td>cpu models</td><td>{{os.cpus.model}}</td></tr>
            <tr><td>cpu speeds</td><td>{{os.cpus.speed}}</td></tr>
            <tr><td>uptime</td><td>{{os.uptime}}</td></tr>
            <tr><td>load avg</td><td>{{os.loadavg}}</td></tr>
            <tr><td>total memory</td><td>{{os.totalmem}}</td></tr>
            <tr><td>free memory</td><td>{{os.freemem}} ({{os.freemempercent}}%)</td></tr>
            <tr><td colspan="2"><h3>process</h3></td></tr>
            <tr><td>resident set size</td><td>{{process.rss}}</td></tr>
            <tr><td>v8 heap total</td><td>{{process.heapTotal}}</td></tr>
            <tr><td>v8 heap used</td><td>{{process.heapUsed}}</td></tr>
            <tr><td colspan="2"><h3>timezone</h3></td></tr>
            <tr><td>timezone</td><td>{{intlTimezone}}</td></tr>
            <tr><td>offset</td><td>{{dateTzOffset}}</td></tr>
        </tbody>
    </table>
    <table>
        <thead>
            <th colspan="2"><h2>Node versions</h2></th>
        </thead>
        <tbody>
        {{#each process.versions}}
        <tr><td>{{@key}}</td><td>{{this}}</td></tr>
        {{/each}}
        </tbody>
    </table>
    
    {{#if process.env.NODE_ENV}}
    <table>
        <thead>         
            <th colspan="2">nbsp;</th>
        </thead>
        <tbody>
            <tr><td>NODE_ENV</td><td>{{process.env.NODE_ENV}}</td></tr>
        </tbody>       
    </table>
    {{/if}}
    
    <table>
        {{#if request}}
        <thead>
            <th colspan="2"><h2>Request</h2></th>
        </thead>
        <tr><td>method</td><td>{{request.method}}</td></tr>
        <tr><td>href</td><td>{{request.href}}</td></tr>
        <tr><td>remote ip</td><td>{{request.ip_addr}}</td></tr>
        <thead>
            <th colspan="2"><h3>headers</h3></th>
        </thead>
        {{#if request.showOriginalUrl}}
        <tr><td>original url</td><td>{{request.originalUrl}}</td></tr>
        {{/if}}
        {{#each request.headers}}
        <tr><td style="white-space:nowrap">{{@key}}</td><td>{{this}}</td></tr>
        {{/each}}
        <tr>
            <td>cookies</td>
            <td>
                <table>
                    {{#each request.cookies}}
                    <tr><td>{{@key}}</td><td>:</td><td style="word-break:break-all">{{this}}</td></tr>
                    {{/each}}
                </table>
            </td>
        </tr>
        {{else}}
        <thead>
            <th colspan="2"><h2>No request object supplied</h2></th>
        </thead>
        {{/if}}
    </table>
    
</main>`;


/**
 * Returns Node.js configuration information as an HTML page.
 *
 * @param   {Object} req - Node request object.
 * @param   {Object} [options]
 * @param   {string} [options.style] - Optional CSS which can be used to style output.
 * @returns {string} HTML page with configuration information.
 */
function nodejsinfo(req, options) {
    const defaults = { style: '' };
    const opt = Object.assign(defaults, options);

    const context = {};

    context.styleOverride = opt.style;

    // package.dependencies
    context.package = packageJson ? Object.assign({}, packageJson) : null;
    context.dependencies = dependenciesJson ? Object.assign( {}, dependenciesJson ) : null;
    if (context.package && context.package.dependencies) { // convert dependencies to list
      Object.keys(context.package.dependencies).forEach( function( _dependencyName ){
        context.package.dependencies[ _dependencyName ] = context.dependencies.dependencies[ _dependencyName ].version;
      } );
    }

    // useful functions from 'os'
    const osFunctions = [ 'cpus', 'freemem', 'hostname', 'loadavg', 'platform', 'release', 'totalmem', 'type', 'uptime' ];
    context.os = {}; // results of executing os functions
    for (const fn of osFunctions) { context.os[fn] = os[fn](); }
    // and some formatting
    context.os.uptime = humanizeDuration(context.os.uptime*1000, { units: [ 'd', 'h', 'm' ], round: true });
    context.os.loadavg.forEach(function(l, i, loadavg) { loadavg[i] = l.toFixed(2); });
    context.os.loadavg = context.os.loadavg.join(' ');
    context.os.freemempercent = Math.round(context.os.freemem/context.os.totalmem*100);
    context.os.totalmem = prettysize(context.os.totalmem);
    context.os.freemem = prettysize(context.os.freemem);
    context.os.ip_address = _getIP();
    // bit of magic to generate nice presentation for CPUs info
    const cpus = { model: {}, speed: {} };
    for (let c=0; c<os.cpus().length; c++) {
        cpus.model[os.cpus()[c].model] = (cpus.model[os.cpus()[c].model] || 0) + 1;
        cpus.speed[os.cpus()[c].speed] = (cpus.speed[os.cpus()[c].speed] || 0) + 1;
    }
    context.os.cpus = { model: [], speed: [] };
    for (const p in cpus.model) context.os.cpus.model.push(cpus.model[p]+' × '+p);
    for (const p in cpus.speed) context.os.cpus.speed.push(cpus.speed[p]+' × '+p);
    context.os.cpus.model = context.os.cpus.model.join(', ');
    context.os.cpus.speed = context.os.cpus.speed.join(', ') + ' MHz';

    // everything from process (for process memory and Node versions)
    context.process = process;

    context.process.rss = prettysize(process.memoryUsage().rss);
    context.process.heapTotal = prettysize(process.memoryUsage().heapTotal);
    context.process.heapUsed = prettysize(process.memoryUsage().heapUsed);

    context.intlTimezone = Intl.DateTimeFormat('en').resolvedOptions().timeZone;
    context.dateTzOffset = Date().match(/([A-Z]+[\+-][0-9]{4}.*)/)[1];

    if (req.headers) {
        const protocol = req.socket.encrypted || req.headers['x-forwarded-proto']==='https' ? 'https' : 'http';
        context.request = req;
        // add in href & remote IP address (stackoverflow.com/questions/8107856)
        context.request.href = protocol + '://' + req.headers.host + req.url;
        context.request.ip_addr = req.headers['x-forwarded-for']
            || req.connection.remoteAddress
            || req.socket.remoteAddress
            || req.connection.socket.remoteAddress;

        // cookies go in separate nested table
        context.request.cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
        delete context.request.headers.cookie;
    }

    context.puppeteerBrowserVersion = puppeteerBrowserVersion;

    const templateFn = handlebars.compile(template);
    const html = templateFn(context);

    return html;
}

function _getIP() {

    const nets = networkInterfaces();
    let _ipAddresses = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                _ipAddresses.push( net.address );
            }
        }
    }
    return _ipAddresses.join( ', ' );

}

async function getPuppeteerBrowserVersion() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let version = await page.browser().version();
    await browser.close();
    return version.replace( 'Headless', '' );
}

module.exports = nodejsinfo; // ≡ export default nodeinfo