import 'dotenv/config';

const testMoodleToken = async (token) => {
    const MOODLE_BASE_URL = process.env.MOODLE_BASE_URL
    if (!token) {
        return false;
    }
    try {
        const response = await fetch(`${MOODLE_BASE_URL}webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`);
        if (!response.ok) {
            console.error("Failed to fetch Moodle site info:", response.statusText);
            return false;
        }
        const data = await response.json();
        if (data.errorcode) {
            return false;
        }


        return true;
    } catch (error) {
        console.error("Error testing Moodle token:", error);
        return false;
    }
}

export default testMoodleToken;