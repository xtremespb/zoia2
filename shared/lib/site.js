import auth from './auth';
import locale from './locale';
import catalogs from '../utils/lingui-catalogs-node';
import site from '../../etc/site.json';

export default {
    getSiteData: async (req, fastify, db) => {
        const user = await auth.getUserData(req, fastify, db);
        const languagesArr = Object.keys(site.languages);
        const {
            languages
        } = site;
        const language = locale.getLocaleFromURL(req);
        const t = catalogs(language);
        const title = locale.getSiteTitle(language);
        return {
            user,
            language,
            languages,
            languagesArr,
            t,
            title
        };
    }
};
