const { withDangerousMod, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
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
        const projectName = config.modRequest.projectName;
        const targetUuid = xcodeProject.getFirstTarget().uuid; // Required for addResourceFile

        // Destination: ios/chronos/tinyllama-1.1b-chat.gguf
        const iosDest = path.join(config.modRequest.platformProjectRoot, projectName, MODEL_NAME);

        // Ensure directory exists and copy file
        if (!fs.existsSync(path.dirname(iosDest))) {
            fs.mkdirSync(path.dirname(iosDest), { recursive: true });
        }
        fs.copyFileSync(src, iosDest);

        // Add to 'Resources' group (create if needed)
        // This avoids issues with finding the main project group which often lacks a name.
        const groupName = 'Resources';
        IOSConfig.XcodeUtils.ensureGroupRecursively(xcodeProject, groupName);

        // Path relative to project root (since Resources usually has no specific path or is root-relative)
        const resourcePath = path.join(projectName, MODEL_NAME);

        console.log(`[withGguf] Adding resource '${resourcePath}' to default group (Resources)`);

        // Use standard addResourceFile, letting it default to 'Resources' or main group.
        // We already ensured 'Resources' exists so it should be fine.
        xcodeProject.addResourceFile(resourcePath, { target: targetUuid });

        return config;
    });

    return config;
};

module.exports = withGguf;
