import 'dotenv/config';

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import https from 'https';


class CookieJar {
    constructor() { this.cookies = new Map(); }
    addCookies(setCookieHeaders) {
        if (!setCookieHeaders) return;
        if (typeof setCookieHeaders === 'string') setCookieHeaders = [setCookieHeaders];
        setCookieHeaders.forEach(cookieString => {
            const [nameValue] = cookieString.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) this.cookies.set(name.trim(), value.trim());
        });
    }
    getCookieHeader() {
        return Array.from(this.cookies.entries()).map(([n, v]) => `${n}=${v}`).join('; ');
    }
}

// --- HTTP Request Helper with Cookie Management ---
async function makeRequest(url, method = 'GET', body = null, headers = {}, cookieJar, followRedirects = true) {
    const debug = process.env.DEBUG_MOODLE === 'true';
    const defaultHeaders = {
        'User-Agent': "Mozilla/5.0 (Linux; Android 12; ...MoodleMobile 4.5.0 (45002)",
        'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        'X-Requested-With': "com.moodle.moodlemobile",
        'Accept-Encoding': "gzip, deflate, br",
        'Accept-Language': "en-US,en;q=0.9",
        'Connection': "keep-alive",
        'Cookie': cookieJar.getCookieHeader(),
        ...headers
    };
    const options = {
        method,
        headers: defaultHeaders,
        redirect: followRedirects ? 'follow' : 'manual',
        follow: 20,
        agent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
    };
    if (body) options.body = body;
    if (debug) console.log(`[Request] ${method} ${url}`);
    try {
        const response = await fetch(url, options);
        // Handle cookies
        const setCookieHeaders = response.headers.raw()['set-cookie'];
        if (setCookieHeaders) {
            cookieJar.addCookies(setCookieHeaders);
            if (debug) console.log('[Cookies] Updated cookie jar:', cookieJar.getCookieHeader());
        }
        // Handle manual redirects for CAS
        if ((response.status === 302 || response.status === 301)) {
            const location = response.headers.get('location');
            if (debug) console.log('[Request] Redirect to:', location);
            if (location) return { redirect: true, location, response };
        }
        return { redirect: false, response };
    } catch (error) {
        if (error.type === 'max-redirect') {
            if (debug) console.log('[Request] Redirect chain analysis:', error.redirectChain);
            if (error.response) return { redirect: false, response: error.response };
        }
        throw error;
    }
}

// --- Utility: Follow All Redirects ---
async function followAllRedirects(url, cookieJar, maxRedirects = 10) {
    let currentUrl = url;
    let lastResponse = null;
    for (let i = 0; i < maxRedirects; i++) {
        const { redirect, location, response } = await makeRequest(currentUrl, 'GET', null, {}, cookieJar, false);
        lastResponse = response;
        if (redirect && location) {
            currentUrl = location;
        } else {
            break;
        }
    }
    return lastResponse;
}



const moodleToken = async (username, password) => {
    const cookieJar = new CookieJar();
    const mobilePassport = Date.now().toString();

    const MOODLE_BASE_URL = process.env.MOODLE_BASE_URL;
    const CAS_BASE_URL = process.env.CAS_BASE_URL;
    const MOBILE_URLSCHEME = process.env.MOBILE_URLSCHEME;

    try {
        // Step 1: Initial Moodle login page
        const initialUrl = `${MOODLE_BASE_URL}login/index.php`;
        let { response } = await makeRequest(initialUrl, 'GET', null, {}, cookieJar, false);

        const html = await response.text();
        const $ = cheerio.load(html);
        const casUrl = $('a[href*="authCAS=CAS"]').attr('href');
        if (!casUrl) {
            return { success: false, message: "URL CAS non trouvée sur la page Moodle." };
        }
        const fullCasUrl = casUrl.startsWith('http') ? casUrl : `${MOODLE_BASE_URL}${casUrl.startsWith('/') ? casUrl.slice(1) : casUrl}`;

        // Step 2: Go to CAS login
        const casResponse = await makeRequest(fullCasUrl, 'GET', null, {}, cookieJar, false);
        if (!casResponse.redirect) {
            return { success: false, message: "CAS n'a pas redirigé comme prévu." };
        }

        const cleanLocation = casResponse.location.replace('&gateway=true', '');
        const casRedirectResponse = await makeRequest(cleanLocation, 'GET', null, {}, cookieJar, false);

        // Step 3: Submit credentials to CAS
        const casHtml = await casRedirectResponse.response.text();
        const $cas = cheerio.load(casHtml);
        const execution = $cas('input[name="execution"]').val();
        if (!execution) {
            return { success: false, message: "Jeton d'exécution CAS introuvable." };
        }

        const formData = new URLSearchParams({
            username: username,
            password: password,
            execution: execution,
            _eventId: 'submit',
            geolocation: ''
        });

        const loginResponse = await makeRequest(
            `${CAS_BASE_URL}login`,
            'POST',
            formData.toString(),
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': CAS_BASE_URL,
                'Referer': cleanLocation
            },
            cookieJar,
            false
        );

        if (!loginResponse.redirect) {
            return { success: false, message: "Authentification CAS échouée. Vérifiez vos identifiants." };
        }

        // Step 4: Follow Moodle redirects with ticket
        const ticketResponse = await makeRequest(loginResponse.location, 'GET', null, {}, cookieJar, false);
        if (!ticketResponse.redirect) {
            return { success: false, message: "Validation du ticket échouée." };
        }

        // Step 5: Follow all Moodle redirects to finalize session
        await followAllRedirects(ticketResponse.location, cookieJar);

        // Step 6: Test final connection via the mobile API
        const mobileUrl = `${MOODLE_BASE_URL}admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=${mobilePassport}&urlscheme=${MOBILE_URLSCHEME}`;
        const mobileResponse = await makeRequest(mobileUrl, 'GET', null, {}, cookieJar, false);

        const locationHeader = mobileResponse.response.headers.get('location');
        if (!locationHeader || !locationHeader.includes('token=')) {
            return { success: false, message: "Aucun token trouvé dans l'en-tête de redirection." };
        }

    // Extract the token after 'token='
    const tokenEncoded = locationHeader.split('token=')[1];
    // Decode from base64
    const tokenDecoded = Buffer.from(tokenEncoded, 'base64').toString('utf-8');
    // Get the middle part between the first and last '::'
    const parts = tokenDecoded.split('::');
    let middle = parts.length >= 3 ? parts[1] : tokenDecoded; // fallback if format is unexpected
    // Sanitize: trim whitespace and stray leading/trailing colons
    middle = middle.trim().replace(/^:+/, '').replace(/:+$/, '');

    return { success: true, token: middle };

    } catch (error) {
        console.error('[Login] Error details:', error);
        return { success: false, message: "Erreur lors de la connexion à Moodle : " + (error.message || error) };
    }
}

export default moodleToken;