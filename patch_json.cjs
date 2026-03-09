const fs = require('fs');

try {
    const content = fs.readFileSync('temp_local.json', 'utf8');
    const config = JSON.parse(content);

    if (!config.services.CoAuthoring['request-filtering-agent']) {
        config.services.CoAuthoring['request-filtering-agent'] = {};
    }

    config.services.CoAuthoring['request-filtering-agent'].allowPrivateIPAddress = true;
    config.services.CoAuthoring['request-filtering-agent'].allowMetaIPAddress = true;

    fs.writeFileSync('temp_local.json', JSON.stringify(config, null, 2), 'utf8');
    console.log("Successfully patched temp_local.json");
} catch (e) {
    console.error(e);
}
