import {
    ObjectId
} from 'mongodb';
import auth from '../../../shared/api/auth';

const editableColumns = ['username', 'email', 'active'];
const noDupes = ['username', 'email'];

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                columnId: {
                    type: 'string',
                    pattern: `^(${editableColumns.join('|')})$`
                },
                recordId: {
                    type: 'string',
                    minLength: 24,
                    maxLength: 24,
                    pattern: '^[a-f0-9]+$'
                },
                value: {
                    type: 'string',
                    minLength: 0,
                    maxLength: 128,
                }
            },
            required: ['token', 'columnId', 'recordId']
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
        let value = req.body.value || '';
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
            // Check if record exists
            const userRecord = await this.mongo.db.collection('users').findOne({
                _id: new ObjectId(req.body.recordId)
            });
            if (!userRecord) {
                return rep.code(400).send(JSON.stringify({
                    statusCode: 400,
                    error: 'Non-existent record'
                }));
            }
            // Perform the format validation
            let formatValidationError;
            switch (req.body.columnId) {
            case 'username':
                formatValidationError = !value || !value.match(/^[a-z0-9_-]{4,32}$/i);
                if (!formatValidationError) {
                    value = value.toLowerCase();
                }
                break;
            case 'email':
                // eslint-disable-next-line no-control-regex
                formatValidationError = !value || !value.match(/^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/);
                if (!formatValidationError) {
                    value = value.toLowerCase();
                }
                break;
            case 'active':
                // eslint-disable-next-line no-control-regex
                formatValidationError = !value.match(/^(0|1)$/);
                if (!formatValidationError) {
                    value = parseInt(value, 10);
                }
                break;
            default:
                formatValidationError = false;
                break;
            }
            if (formatValidationError) {
                return rep.code(200).send(JSON.stringify({
                    statusCode: 400,
                    errorCode: 2,
                    errorField: req.body.columnId,
                    error: 'Invalid format'
                }));
            }
            // Check for dupes
            // eslint-disable-next-line consistent-return
            if (noDupes.indexOf(req.body.columnId) !== -1 && userRecord[req.body.columnId] !== value) {
                const dupeQuery = {};
                dupeQuery[req.body.columnId] = value;
                const dupeRecord = await this.mongo.db.collection('users').findOne(dupeQuery);
                if (dupeRecord) {
                    return rep.code(200).send(JSON.stringify({
                        statusCode: 400,
                        errorCode: 1,
                        error: 'Duplicate value'
                    }));
                }
            }
            // Update if value mismatches
            if (userRecord[req.body.columnId] !== value) {
                const update = {};
                update[req.body.columnId] = value;
                this.mongo.db.collection('users').updateOne({
                    _id: new ObjectId(req.body.recordId)
                }, {
                    $set: update
                });
            }
            // Send response
            return rep.code(200)
                .send(JSON.stringify({
                    statusCode: 200,
                    value
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