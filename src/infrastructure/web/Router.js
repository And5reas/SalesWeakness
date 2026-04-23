import { URL } from 'url';

export class Router {
  constructor(stageController, auditController, leadController) {
    this.stageController = stageController;
    this.auditController = auditController;
    this.leadController = leadController;

    this.routes = [
      {
        method: 'POST',
        pattern: /^\/v1\/config\/stages\/([^/]+)\/sla$/,
        handler: this.stageController.configureSla.bind(this.stageController),
        getParams: (match) => ({ id: match[1] })
      },
      {
        method: 'GET',
        pattern: /^\/v1\/audit\/bottlenecks$/,
        handler: this.auditController.getBottlenecks.bind(this.auditController),
        getParams: () => ({})
      },
      {
        method: 'GET',
        pattern: /^\/v1\/audit\/conversion-latency$/,
        handler: this.auditController.getConversionLatency.bind(this.auditController),
        getParams: () => ({})
      },
      {
        method: 'POST',
        pattern: /^\/v1\/leads\/ingest$/,
        handler: this.leadController.ingest.bind(this.leadController),
        getParams: () => ({})
      }
    ];
  }

  async parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > MAX_BODY_SIZE) {
          reject(new Error('Payload too large'));
          req.destroy();
        }
      });

      req.on('end', () => {
        if (!body) {
          return resolve({});
        }
        try {
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            return resolve(JSON.parse(body));
          }
          resolve({ raw: body });
        } catch (err) {
          reject(new Error('Invalid JSON body'));
        }
      });

      req.on('error', err => reject(err));
    });
  }

  async handleRequest(req, res) {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;

      req.query = Object.fromEntries(parsedUrl.searchParams.entries());
      req.params = {};

      // CORS Headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.body = await this.parseBody(req);
      } else {
        req.body = {};
      }

      for (const route of this.routes) {
        if (req.method !== route.method) continue;
        const match = pathname.match(route.pattern);
        if (!match) continue;

        req.params = route.getParams(match);
        return route.handler(req, res);
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found' }));

    } catch (err) {
      console.error('Router error:', err.message);

      if (err.message === 'Invalid JSON body') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }

      if (err.message === 'Payload too large') {
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Payload too large' }));
      }

      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
}