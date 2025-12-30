const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODEL_SOURCE = 'assets/models/tinyllama-1.1b-chat.gguf';
const MODEL_NAME = 'tinyllama-1.1b-chat.gguf';

const withGguf = (config) => {
    // Android: Copy to assets
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const src = path.join(config.modRequest.projectRoot, MODEL_SOURCE);
            const dest = path.join(config.modRequest.platformProjectRoot, 'app/src/main/assets', MODEL_NAME);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
            return config;
        },
    ]);

    // iOS: Copy to project and link
    config = withXcodeProject(config, async (config) => {
        const xcodeProject = config.modResults;
        const src = path.join(config.modRequest.projectRoot, MODEL_SOURCE);
        // Copy to ios/chronos/ (where Info.plist is)
        const iosDest = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName, MODEL_NAME);
        fs.copyFileSync(src, iosDest);

        // Add to Xcode Project
        xcodeProject.addResourceFile(MODEL_NAME, { target: xcodeProject.getFirstTarget().uuid });
        return config;
    });

    return config;
};

module.exports = withGguf;
