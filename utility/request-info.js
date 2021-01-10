class RequestInfo {
  getIP(request) {
    var ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    ip = ip.split(',')[0];
    ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    return ip;
  }

  getUserAgent( request ) {
    return request.headers[ 'user-agent' ];
  }

  getMethod( request ) {
    return request.method;
  }

  getURL( request ) {
    return request.protocol + '://' + request.get('host') + request.originalUrl;
  }

}

module.exports = new RequestInfo();