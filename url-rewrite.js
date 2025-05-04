function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Handle root path
    if (uri === '/') {
        request.uri = '/index.html';
        return request;
    }
    
    // Handle direct file requests (assets, images, etc)
    if (uri.includes('.')) {
        return request;
    }
    
    // For all other paths, serve index.html
    request.uri = '/index.html';
    
    return request;
} 