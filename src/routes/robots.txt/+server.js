import { PRODUCTION_DOMAIN } from "$env/static/private";
import DEV_ROBOTS_TXT from "./dev_robots.txt?raw";
import PRODUCTION_ROBOTS_TXT from "./production_robots.txt?raw";

export async function GET({ url }) {
    const isProd = url.origin.includes(PRODUCTION_DOMAIN);

    // Show production robots only in production
    const showProductionRobots = isProd;
    const robotsContent = showProductionRobots
        ? PRODUCTION_ROBOTS_TXT
        : DEV_ROBOTS_TXT;

    return new Response(robotsContent);
}
