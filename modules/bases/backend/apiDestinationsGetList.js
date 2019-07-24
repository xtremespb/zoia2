import auth from '../../../shared/api/auth';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                language: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 2
                },
                destination: {
                    type: 'string',
                    pattern: '^[0-9]+$'
                }
            },
            required: ['token', 'language']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        if (req.validationError) {
            req.log.error({
                ip: req.ip,
                path: req.urlData().path,
                query: req.urlData().query,
                error: req.validationError.message
            });
            return rep.code(400).send(JSON.stringify(req.validationError));
        }
        // End of Validation
        // Check permissions
        const user = await auth.verifyToken(req.body.token, fastify, this.mongo.db);
        if (!user || !user.admin) {
            req.log.error({
                ip: req.ip,
                path: req.urlData().path,
                query: req.urlData().query,
                error: 'Authentication failed'
            });
            return rep.code(403).send(JSON.stringify({
                statusCode: 403,
                error: 'Authentication failed'
            }));
        }
        // End of check permissions
        try {
            // Get data
            const query = {
                _id: {
                    $gte: 1000
                }
            };
            const destinations = {};
            (await this.mongo.db.collection('destinations').find(query).toArray() || []).map(d => {
                const destination = d;
                const [
                    en,
                    ru
                ] = destination.name.split(/\|/);
                destination.name = req.body.language === 'ru' ? ru : en;
                destinations[destination._id] = destination.name;
            });
            const countries = {};
            if (Object.keys(destinations).length) {
                const destination = req.body.destination ? parseInt(req.body.destination, 10) : parseInt(Object.keys(destinations)[0], 10);
                (await this.mongo.db.collection('countries').find({
                    destination
                }).toArray() || []).map(d => {
                    const country = d;
                    const [
                        en,
                        ru
                    ] = country.name.split(/\|/);
                    country.name = req.body.language === 'ru' ? ru : en;
                    countries[country._id] = country.name;
                });
            }
            // Send response
            return rep.code(200)
                .send(JSON.stringify({
                    statusCode: 200,
                    destinations,
                    countries
                }));
        } catch (e) {
            req.log.error({
                ip: req.ip,
                path: req.urlData().path,
                query: req.urlData().query,
                error: e
            });
            return rep.code(500).send(JSON.stringify({
                statusCode: 500,
                error: 'Internal server error',
                message: e.message
            }));
        }
    }
});
