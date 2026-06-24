import * as fs from 'fs';
import * as path from 'path';
import { parseSkillMarkdown } from '../parser/frontmatter-parser.js';
import { compileSkillForTool } from '../compiler/compiler-factory.js';
import { SupportedTool, isSupportedTool } from '../domain/supported-tool.js';
import { ValidationError } from '../errors/skill-config-error.js';
export function runCompileCli(processArguments) {
    try {
        const cliArguments = parseCompileCliArguments(processArguments);
        const skillMarkdownContent = fs.readFileSync(cliArguments.skillFilePath, 'utf-8');
        const parsedSkill = parseSkillMarkdown(skillMarkdownContent, {
            filePath: cliArguments.skillFilePath,
        });
        const compiledOutput = compileSkillForTool(parsedSkill.config, parsedSkill.body, cliArguments.targetTool);
        if (cliArguments.outputMode === 'folder') {
            writeCompiledOutputToFolder(cliArguments, compiledOutput);
        }
        else {
            writeCompiledOutputToStdout(compiledOutput);
        }
        return 0;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Compile failed: ${errorMessage}\n`);
        return 1;
    }
}
function parseCompileCliArguments(processArguments) {
    const skillFilePath = extractStringArgument(processArguments, '--skill');
    const targetToolName = extractStringArgument(processArguments, '--tool');
    const outputFolderPath = extractOptionalStringArgument(processArguments, '--output');
    if (skillFilePath === undefined) {
        throw new ValidationError('Missing required argument: --skill <path-to-skill-file>');
    }
    if (targetToolName === undefined) {
        throw new ValidationError('Missing required argument: --tool <target-tool>');
    }
    if (!isSupportedTool(targetToolName)) {
        throw new ValidationError(`Unsupported target tool: ${targetToolName}. ` +
            `Supported tools: ${Object.values(SupportedTool).join(', ')}.`);
    }
    if (outputFolderPath !== undefined && outputFolderPath !== 'stdout') {
        return {
            skillFilePath,
            targetTool: targetToolName,
            outputMode: 'folder',
            outputFolderPath,
        };
    }
    return {
        skillFilePath,
        targetTool: targetToolName,
        outputMode: 'stdout',
        outputFolderPath: '',
    };
}
function extractStringArgument(processArguments, argumentName) {
    const argumentIndex = processArguments.indexOf(argumentName);
    if (argumentIndex === -1 || argumentIndex + 1 >= processArguments.length) {
        return undefined;
    }
    return processArguments[argumentIndex + 1];
}
function extractOptionalStringArgument(processArguments, argumentName) {
    return extractStringArgument(processArguments, argumentName);
}
function writeCompiledOutputToStdout(compiledOutput) {
    process.stdout.write(compiledOutput.markdownContent);
    process.stdout.write('\n');
    if (compiledOutput.structuredMetadata !== undefined) {
        process.stdout.write('\n--- Structured Metadata ---\n');
        process.stdout.write(JSON.stringify(compiledOutput.structuredMetadata, null, 2));
        process.stdout.write('\n');
    }
}
function writeCompiledOutputToFolder(cliArguments, compiledOutput) {
    if (!fs.existsSync(cliArguments.outputFolderPath)) {
        fs.mkdirSync(cliArguments.outputFolderPath, { recursive: true });
    }
    const baseFileName = path.basename(cliArguments.skillFilePath, path.extname(cliArguments.skillFilePath));
    const outputFileName = `${baseFileName}.${compiledOutput.targetTool}.md`;
    const outputFilePath = path.join(cliArguments.outputFolderPath, outputFileName);
    fs.writeFileSync(outputFilePath, compiledOutput.markdownContent);
    if (compiledOutput.structuredMetadata !== undefined) {
        const metadataFileName = `${baseFileName}.${compiledOutput.targetTool}.metadata.json`;
        const metadataFilePath = path.join(cliArguments.outputFolderPath, metadataFileName);
        fs.writeFileSync(metadataFilePath, JSON.stringify(compiledOutput.structuredMetadata, null, 2));
    }
    process.stdout.write(`Compiled output written to: ${outputFilePath}\n`);
}
if (require.main === module) {
    const exitCode = runCompileCli(process.argv.slice(2));
    process.exit(exitCode);
}
//# sourceMappingURL=compile-cli.js.map