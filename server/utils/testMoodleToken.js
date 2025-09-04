import 'dotenv/config';
import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const testMoodleToken = async (token) => {
    const MOODLE_BASE_URL = process.env.MOODLE_BASE_URL || '';
    const sanitized = typeof token === 'string' ? token.trim().replace(/^:+/, '').replace(/:+$/, '') : '';
    if (!sanitized) {
        console.error('No Moodle token provided for test');
        return false;
    }
    try {
        const base = MOODLE_BASE_URL.endsWith('/') ? MOODLE_BASE_URL : MOODLE_BASE_URL + '/';
        const url = `${base}webservice/rest/server.php?wstoken=${encodeURIComponent(sanitized)}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`;
        const response = await fetch(url, {
            agent,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 12; ...MoodleMobile 4.5.0 (45002)',
                'Accept': 'application/json, text/plain, */*',
                'X-Requested-With': 'com.moodle.moodlemobile',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            console.error(`Failed to fetch Moodle site info: ${response.status} ${response.statusText} body=${body?.slice(0,300)}`);
                    // Fallback to mobile call endpoint
                    const mobileUrl = `${base}tool/mobile/call.php?moodlewsrestformat=json&wsfunction=tool_mobile_call_external_functions&wstoken=${encodeURIComponent(sanitized)}`;
                    const payload = new URLSearchParams({
                        requests: JSON.stringify([{ index: 0, methodname: 'core_webservice_get_site_info', args: {} }])
                    });
                    const mobileResp = await fetch(mobileUrl, {
                        method: 'POST',
                        agent,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 12; ...MoodleMobile 4.5.0 (45002)'
                        }
                    , body: payload.toString() });
                    if (!mobileResp.ok) return false;
                    const mobileData = await mobileResp.json().catch(() => null);
                    if (!mobileData || mobileData?.exception) return false;
                    return true;
        }
        const data = await response.json();
                if (data?.exception || data?.errorcode) {
                    console.error('Moodle error while testing token:', data);
                    // Fallback to mobile call endpoint
                    const mobileUrl = `${base}tool/mobile/call.php?moodlewsrestformat=json&wsfunction=tool_mobile_call_external_functions&wstoken=${encodeURIComponent(sanitized)}`;
                    const payload = new URLSearchParams({
                        requests: JSON.stringify([{ index: 0, methodname: 'core_webservice_get_site_info', args: {} }])
                    });
                    const mobileResp = await fetch(mobileUrl, {
                        method: 'POST',
                        agent,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 12; ...MoodleMobile 4.5.0 (45002)'
                        }
                    , body: payload.toString() });
                    if (!mobileResp.ok) return false;
                    const mobileData = await mobileResp.json().catch(() => null);
                    if (!mobileData || mobileData?.exception) return false;
                    return true;
        }
        console.log('Moodle token is valid and site is reachable.');
        return true;
    } catch (error) {
        console.error('Error testing Moodle token:', error?.message || error);
        return false;
    }
}

export default testMoodleToken;