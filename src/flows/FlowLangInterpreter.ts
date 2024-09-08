import { FlowBlock } from '~/flows';
import { ExtensionController } from '~/extensions';

const CODE_SINGLE_LINE_COMMENT_REGEX = /(?=(?:[^"']|"[^"]*"|'[^']*')*$)((#|\/\/).*)/g;
const CODE_MULTI_LINE_COMMENT_REGEX = /(?=(?:[^"']|"[^"]*"|'[^']*')*$)(\/\*[\s\S]*?\*\/)/g;

const SYNTAX_REPLACEMENTS: [RegExp, string][] = [
    // Replace `aa[bb]` with `aa(bb)?`
    [ /(.+?)\[(.+?)\]/g, '$1($2)?' ],
    
    // Replace spaces
    [ / +/g, '(\\s*)' ],

    // Replace %inputs% with placeholder
    [ /(?<!%)%[A-z0-9_-]+%(?!%)/g, '(\\b\\w+\\b|[\'"][^\'"]*[\'"])']
];

export interface ExpressionRegisterItem {
    block: FlowBlock,
    expressions: RegExp[]
}

export default class FlowLangInterpreter {
    content: string;
    blocks: FlowBlock[];
    expressionRegister: ExpressionRegisterItem[];

    constructor(blocks: FlowBlock[]) {
        this.blocks = blocks;
        this.updateExpressionRegister();
    }

    parse(content: string) {
        const lines = this.parseContent(content);

        lines.forEach(line => {
            const match = this.matchExpressions(line);
            console.log({ line, match });
        }) 
    }

    matchExpressions(line: string) {
        let foundMatch = null;

        for(const item of this.expressionRegister) {
            const exp = item.expressions.find(exp => exp.test(line));
            if(exp) {
                foundMatch = {
                    block: item.block,
                    exp: exp
                }
                break;
            }
        }

        return foundMatch;
    }

    updateExpressionRegister() {
        this.expressionRegister = this.blocks.map(block => {
            const expressions = this.getExpressions(block);
            return { block, expressions };
        })
    }
    
    getExpressions(block: FlowBlock) {
        const syntaxes = block.$module.methods.getSyntax();

        const expressions: RegExp[] = [];
        syntaxes.forEach(str => {
            const exp = this.createExpression(str);
            if(!exp) return;
            expressions.push(exp);
        })

        return expressions;
    }

    createExpression(str: string) {
        if(typeof str !== 'string') return;

        SYNTAX_REPLACEMENTS.forEach(([ a, b]) => {
            str = str.replaceAll(a, b);
        });

        // // Replace all space characters with to match all variants
        // str = str.replace(SYNTAX_FIND_SPACE_REGEX, SYNTAX_REPLACE_SPACE_REGEX);

        // // Find %inputs%, and replace them with a wildcard
        // str = str.replace(SYNTAX_FIND_INPUT_REGEX, SYNTAX_REPLACE_INPUT_REGEX);
        
        // Match full line
        str = '^\\s*'+str+'\\s*$';
            
        return new RegExp(str, 'i');
    }

    parseContent(content: string): string[] {
        // Remove single line comments
        content = content.replaceAll(CODE_SINGLE_LINE_COMMENT_REGEX, '');
        content = content.replaceAll(CODE_MULTI_LINE_COMMENT_REGEX, '');

        // Remove multiline comments

        // Split code into lines
        const lines = content.split('\n')

        // Format each line and remove empty lines
        return lines.map(l => this.formatLine(l)).filter(l => typeof l === 'string') as string[];
    }

    formatLine(line: string) {
        line = line.trim();

        if(line.length === 0) return null;

        return line;
    }
}