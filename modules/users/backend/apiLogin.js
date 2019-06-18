const crypto = require('crypto');
const config = require('../../../etc/config.json');

module.exports = fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 32,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 64
                }
            },
            required: ['username', 'password']
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
        // Processing
        try {
            const passwordHash = crypto.createHmac('sha512', config.secret).update(req.body.password).digest('hex');
            const user = await this.mongo.db.collection('users').findOne({
                username: req.body.username
            });
            if (!user || user.password !== passwordHash) {
                return rep.code(200)
                    .send(JSON.stringify({
                        statusCode: 404,
                        message: 'User not found or invalid password'
                    }));
            }
            // Send response
            const token = fastify.jwt.sign({
                id: user._id
            }, {
                expiresIn: config.authTokenExpiresIn
            });
            delete user.password;
            return rep.code(200)
                .send(JSON.stringify({
                    statusCode: 200,
                    token,
                    user
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