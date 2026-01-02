const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TARGET_DIR = path.join(__dirname, '../src/app/share-target');
const TEMP_DIR = path.join(__dirname, '../src/app/share-target.ignore');

function renameDir(src, dest) {
    if (fs.existsSync(src)) {
        console.log(`Renaming ${src} to ${dest}`);
        fs.renameSync(src, dest);
        return true;
    }
    return false;
}

function patchPlugin() {
    const pluginPath = path.join(__dirname, '../node_modules/capacitor-plugin-send-intent/dist/esm/web.js');
    // Patch web.js
    if (fs.existsSync(pluginPath)) {
        console.log('Patching capacitor-plugin-send-intent (web.js)...');
        let content = fs.readFileSync(pluginPath, 'utf8');
        if (content.includes('registerWebPlugin')) {
            content = content.replace("import { registerWebPlugin } from '@capacitor/core';", "// import { registerWebPlugin } from '@capacitor/core';");
            content = content.replace("registerWebPlugin(SendIntent);", "// registerWebPlugin(SendIntent);");
            fs.writeFileSync(pluginPath, content);
            console.log('Plugin (web.js) patched successfully.');
        } else {
            console.log('Plugin (web.js) already patched.');
        }
    }

    // Patch build.gradle (Namespace Issue)
    const gradlePath = path.join(__dirname, '../node_modules/capacitor-plugin-send-intent/android/build.gradle');
    if (fs.existsSync(gradlePath)) {
        console.log('Patching capacitor-plugin-send-intent (build.gradle)...');
        let content = fs.readFileSync(gradlePath, 'utf8');
        if (!content.includes('namespace "com.gustavosanjose.capacitorpluginsendintent"')) {
            // Inject namespace inside android { ... }
            content = content.replace(/android\s*{/, 'android {\n    namespace "com.gustavosanjose.capacitorpluginsendintent"');
            fs.writeFileSync(gradlePath, content);
            console.log('Plugin (build.gradle) patched with namespace.');
        } else {
            console.log('Plugin (build.gradle) already has namespace.');
        }
    } else {
        console.warn('Plugin build.gradle not found at:', gradlePath);
    }
}

const restore = () => {
    if (fs.existsSync(TEMP_DIR)) {
        console.log('Restoring share-target directory...');
        renameDir(TEMP_DIR, TARGET_DIR);
    }
};

try {
    // 0. Clean .next directory to prevent stale type errors
    const nextDir = path.join(__dirname, '../.next');
    if (fs.existsSync(nextDir)) {
        console.log('Cleaning .next directory...');
        fs.rmSync(nextDir, { recursive: true, force: true });
    }

    // 1. Rename conflicting directory
    const renamed = renameDir(TARGET_DIR, TEMP_DIR);

    // 1.5 Patch Plugin
    patchPlugin();

    // 2. Run Next.js Build
    console.log('Starting Mobile (Static) Build...');

    // Set env var for next.config.ts to pick up
    process.env.NEXT_PUBLIC_BUILD_MODE = 'static';

    execSync('npx next build', { stdio: 'inherit' });

    console.log('Build Complete.');

} catch (error) {
    console.error('Build Failed:', error.message);
    process.exit(1);
} finally {
    // 3. Always restore the directory
    restore();
}
