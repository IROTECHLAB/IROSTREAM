/**
 * IRO STREAM Proxy Function
 * Netlify Function to proxy video requests
 */

const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const videoUrl = event.queryStringParameters.url;
    
    if (!videoUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing url parameter' })
        };
    }

    console.log(`Proxying: ${videoUrl}`);

    try {
        return await proxyVideo(videoUrl, event);
    } catch (error) {
        console.error('Proxy error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function proxyVideo(videoUrl, event) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(videoUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        // Forward headers for CORS and Range support
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Referer': `${parsedUrl.protocol}//${parsedUrl.host}/`
        };

        // Forward Range header for seeking
        if (event.headers.range) {
            headers['Range'] = event.headers.range;
        }

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: headers,
            timeout: 30000
        };

        const proxyReq = protocol.request(options, (proxyRes) => {
            console.log(`Response: ${proxyRes.statusCode}`);

            // Handle redirects
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let redirectUrl = proxyRes.headers.location;
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${redirectUrl}`;
                }
                console.log(`Redirect to: ${redirectUrl}`);
                // For Netlify functions, we need to handle redirects differently
                // For now, return the redirect URL to client
                return resolve({
                    statusCode: proxyRes.statusCode,
                    headers: {
                        'Location': redirectUrl,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Range, Content-Type',
                        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
                    }
                });
            }

            // Prepare response headers
            const responseHeaders = {
                'Content-Type': proxyRes.headers['content-type'] || 'video/mp4',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Range, Content-Type',
                'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            };

            // Copy relevant headers
            if (proxyRes.headers['content-length']) {
                responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
            }
            if (proxyRes.headers['content-range']) {
                responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
            }
            if (proxyRes.headers['accept-ranges']) {
                responseHeaders['Accept-Ranges'] = proxyRes.headers['accept-ranges'];
            }

            // Collect the response data
            const chunks = [];
            proxyRes.on('data', (chunk) => chunks.push(chunk));
            proxyRes.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    statusCode: proxyRes.statusCode,
                    headers: responseHeaders,
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                });
            });

            proxyRes.on('error', (err) => {
                reject(err);
            });
        });

        proxyReq.on('timeout', () => {
            proxyReq.destroy();
            reject(new Error('Request timeout'));
        });

        proxyReq.on('error', (err) => {
            reject(err);
        });

        proxyReq.end();
    });
}