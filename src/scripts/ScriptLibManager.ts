import path from 'path';
import fs from 'fs/promises';
import { camelCase, capitalize } from 'lodash';

const EXTENSIONS_API_BUNDLE_PATH = path.resolve(__dirname, '../../dist/bundles/extensions-api.d.ts');
const HOME_API_BUNDLE_PATH = path.resolve(__dirname, '../../dist/bundles/home-api.d.ts');

export default class ScriptLibManager {
    protected static libs: Array<{ content: string, filePath: string }> = [];

    static async load() {
        await this.loadBundle(EXTENSIONS_API_BUNDLE_PATH, 'api');
        await this.loadBundle(HOME_API_BUNDLE_PATH, 'home');
    }

    static getLibs() {
        return this.libs;
    }
    
    // Process bundle so that it is supported by monaco.
    protected static processBundle(content: string, name: string) {
        const pascalCaseName = capitalize(camelCase(name));

        // Find 'import' statements
        const imports = content.matchAll(/import (\S+) from \S*/gm);

        // Replace all 'declare namespace' with 'declare interface'
        content = content.replace(/^declare namespace/gm, 'declare interface');

        // Remove 'declare' keyword
        content = content.replace(/^declare /gm, '');

        // Find the main/last export
        const mainExport = content.match(/^export \{.*/m);
        if(mainExport) {
            // Wrap the parts before the export in a namespace,
            // because they should not be accessible inside the editor.
            content = `
                declare namespace ${pascalCaseName} {
                    ${content.substring(0, mainExport.index!- 1)}

                    interface Exports {
                        ${content.substring(mainExport.index!)}
                    }
                }

                declare const ${name}: ${pascalCaseName}.Exports
            `;
        } else {
            content = `
                declare namespace ${pascalCaseName} {
                    ${content}
                }

                declare const ${name}: ${pascalCaseName}.Exports
            `;
        }


        // Replace 'export' statements with objects
        content = content.replace(/export { (.*?) }/gm, (match, list: string) => {
            return list
                .split(', ')
                .map(i => {
                    const match =  i.match(/(\S*) as (\w+)/);
                    if(!match) return `${i}: typeof ${i}`;
                    return `${match[2]}: ${match[1]}`
                })
                .join(', ');
        })

        // Comment out properties starting with '$' or '_'
        content = content.replace(/^\s*(\$|_).*: /gm, '// $&');

        // Comment out 'import' statements
        content = content.replace(/^import (.*) from '(.*)';$/gm, '// $&');

        // Comment out 'type X_d_Y = Y' if preceded by a constant declaration
        content = content.replace(/^type (\w+_d_)(\w+)(<.*>)? = (.*)\nconst \1\2: typeof \2/gm, '// $&');
        
        // Replace 'const A = typeof B' with 'type A = B'
        content = content.replace(/const (.*): typeof (\w+)/gm, 'type $1 = typeof $2');

        // Find the names of the variables that were imported
        const importedVars = Array.from(imports).map(match => match[1]);

        // Replace references to the missing imported variables with 'any'
        content = content.replace(/\w+/g, match => {
            if(importedVars.includes(match)) return 'any';
            return match;
        });

        // Delete all lines that are commented out
        content = content.replace(/^\/\/(.*)$/gm, '');

        return content;
    }

    protected static async loadBundle(filePath: string, name: string) {
        const bundleContent = await fs.readFile(filePath, 'utf8');

        this.libs.push({
            content: this.processBundle(bundleContent, name), 
            filePath: `file://bundles/${name}`
        })
    }
}