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
        const projectName = config.modRequest.projectName;

        // Copy to ios/chronos/ (where Info.plist is)
        // We assume the group name matches the project name, which is standard in Expo/RN.
        const iosDest = path.join(config.modRequest.platformProjectRoot, projectName, MODEL_NAME);
        fs.copyFileSync(src, iosDest);

        const targetUuid = xcodeProject.getFirstTarget().uuid;

        // Attempt to find the group to add the file to.
        // 'node-xcode' addResourceFile crashes if it can't find 'Resources' and no group is passed.
        // We will look for the main group which usually is the project name.
        const group = xcodeProject.pbxGroupByName(projectName);

        if (group) {
            // Did we find it? pbxGroupByName returns an object with paths? 
            // node-xcode pbxGroupByName returns the full object. We need the UUID (key)?
            // Wait, addResourceFile takes the group KEY (UUID) as the 3rd argument?
            // documentation says: addResourceFile(path, opt, group)
            // If we don't pass group, it looks for 'Resources'.

            // Actually, let's find the Key for the group. 
            // pbxGroupByName returns the group object, but not the key directly easily unless we iterate.
            // But maybe we can just pass the name? No, usually expects key.

            // Let's try a safer method: addFile then add to sources?
            // But addResourceFile is for "Resources" build phase.

            // Workaround: create 'Resources' group if it doesn't exist?
            // Or better: use the main group key.
            const pbxProjectSection = xcodeProject.pbxProjectSection();
            const firstProjectUuid = Object.keys(pbxProjectSection).find(key => pbxProjectSection[key].isa === 'PBXProject');
            const mainGroupUuid = pbxProjectSection[firstProjectUuid].mainGroup;

            // Let's verify if mainGroup is a valid group to add to. 
            // It usually is the root folder.

            // Let's try adding to the main group.
            xcodeProject.addResourceFile(MODEL_NAME, { target: targetUuid }, mainGroupUuid);
        } else {
            // Fallback: Just try adding it and hope 'Resources' exists or use main group logic above?
            // If pbxGroupByName failed, we are in trouble anyway.
            // Let's explicitly try to use the first available group or mainGroup.
            const pbxProjectSection = xcodeProject.pbxProjectSection();
            const firstProjectUuid = Object.keys(pbxProjectSection).find(key => pbxProjectSection[key].isa === 'PBXProject');
            if (firstProjectUuid) {
                const mainGroupUuid = pbxProjectSection[firstProjectUuid].mainGroup;
                xcodeProject.addResourceFile(MODEL_NAME, { target: targetUuid }, mainGroupUuid);
            } else {
                console.warn("Could not find PBXProject to determine main group.");
                // Try default method as last resort
                xcodeProject.addResourceFile(MODEL_NAME, { target: targetUuid });
            }
        }

        return config;
    });

    return config;
};

module.exports = withGguf;
