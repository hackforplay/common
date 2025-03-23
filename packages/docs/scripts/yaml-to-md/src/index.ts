import * as fs from "fs-extra";
import * as path from "path";
import * as yaml from "js-yaml";

// Define paths
const INPUT_DIR = path.resolve("../../_data/reference/ja");
const OUTPUT_DIR = path.resolve("../../markdown-for-llm/ja");

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR);

// Interface for YAML data structure
interface YamlData {
  [key: string]: {
    name: string;
    type: string;
    desc?: string;
    code?: string;
    args?: Array<{
      name: string;
      type: string;
      desc: string;
      init?: string | number | boolean;
    }>;
    return?: {
      name: string;
      type: string;
      desc: string;
    };
    fields?: {
      [key: string]: {
        name: string;
        type: string;
        desc?: string;
        init?: string | number | boolean;
        code?: string;
        args?: Array<{
          name: string;
          type: string;
          desc: string;
          init?: string | number | boolean;
        }>;
        return?: {
          name: string;
          type: string;
          desc: string;
        };
      };
    };
    init?: string | number | boolean;
  };
}

/**
 * Convert YAML data to Markdown in a more LLM-friendly format
 * This format reduces unnecessary formatting and structure while preserving essential information
 */
function convertToMarkdown(data: YamlData, filename: string): string {
  let markdown = `---\nlayout: default\ntitle: ${path.basename(
    filename,
    ".yml"
  )}\n---\n\n`;

  // Process each top-level entry
  for (const [key, value] of Object.entries(data)) {
    markdown += `# ${value.name}\n`;
    markdown += `type: ${value.type}\n`;

    // Add description if available
    if (value.desc) {
      markdown += `desc: ${value.desc}\n`;
    }

    // Add initialization value if available
    if (value.init !== undefined) {
      markdown += `default: ${value.init}\n`;
    }

    // Add code example if available
    if (value.code) {
      markdown += "\n```javascript\n" + value.code + "```\n";
    }

    // Create a set of method keys to avoid duplication
    const methodKeys = new Set<string>();

    // Identify all methods first
    Object.entries(value.fields || {}).forEach(([key, field]) => {
      // Consider as method if:
      // 1. It has type "function"
      // 2. It has args (even if type is not function)
      // 3. It has code that looks like a function call
      const isExplicitFunction = field.type === "function";
      const hasArgs = field.args && field.args.length > 0;
      const hasFunctionCode =
        field.code &&
        (field.code.includes("await") || field.code.includes("("));

      if (isExplicitFunction || hasArgs || hasFunctionCode) {
        methodKeys.add(key);
      }
    });

    // Now separate fields and methods
    const fields = Object.entries(value.fields || {}).filter(
      ([key, _]) => !methodKeys.has(key)
    );

    const methods = Object.entries(value.fields || {}).filter(([key, _]) =>
      methodKeys.has(key)
    );

    // Process regular fields if available
    if (fields.length > 0) {
      markdown += "\n## Fields\n\n";

      for (const [fieldKey, field] of fields) {
        // Format: fieldName: type (default: value)
        markdown += `${field.name}: ${field.type}`;
        if (field.init !== undefined) {
          const initValue =
            typeof field.init === "string" ? `"${field.init}"` : field.init;
          markdown += ` (default: ${initValue})`;
        }
        markdown += "\n";

        // Add description if available
        if (field.desc) {
          markdown += `${field.desc}\n`;
        }

        // Add code example if available
        if (field.code) {
          markdown += "```javascript\n" + field.code + "```\n";
        }

        markdown += "\n";
      }
    }

    if (methods.length > 0) {
      markdown += "## Methods\n\n";

      for (const [methodKey, method] of methods) {
        // Format: methodName: function
        markdown += `${method.name}: ${method.type}\n`;

        // Add description if available
        if (method.desc) {
          markdown += `${method.desc}\n`;
        }

        // Add arguments if available in a compact format
        if (method.args && method.args.length > 0) {
          markdown += "args: ";

          const argStrings = method.args.map((arg) => {
            let argString = `${arg.name}(${arg.type})`;
            if (arg.init !== undefined) {
              const initValue =
                typeof arg.init === "string" ? `"${arg.init}"` : arg.init;
              argString += ` = ${initValue}`;
            }
            if (arg.desc) {
              argString += `: ${arg.desc}`;
            }
            return argString;
          });

          markdown += argStrings.join(", ") + "\n";
        }

        // Add return value if available in a compact format
        if (method.return) {
          markdown += `returns: ${method.return.name}(${method.return.type})`;
          if (method.return.desc) {
            markdown += `: ${method.return.desc}`;
          }
          markdown += "\n";
        }

        // Add code example if available
        if (method.code) {
          markdown += "```javascript\n" + method.code + "```\n";
        }

        markdown += "\n";
      }
    }

    // Process top-level arguments if available
    if (value.args && value.args.length > 0) {
      markdown += "## Arguments\n\n";

      for (const arg of value.args) {
        markdown += `${arg.name}: ${arg.type}`;
        if (arg.init !== undefined) {
          const initValue =
            typeof arg.init === "string" ? `"${arg.init}"` : arg.init;
          markdown += ` (default: ${initValue})`;
        }
        markdown += "\n";

        if (arg.desc) {
          markdown += `${arg.desc}\n`;
        }

        markdown += "\n";
      }
    }

    // Process top-level return value if available
    if (value.return) {
      markdown += "## Return Value\n\n";
      markdown += `${value.return.name}: ${value.return.type}\n`;

      if (value.return.desc) {
        markdown += `${value.return.desc}\n`;
      }

      markdown += "\n";
    }

    markdown += "---\n\n";
  }

  return markdown;
}

/**
 * Process a single YAML file
 */
async function processFile(filePath: string): Promise<void> {
  try {
    console.log(`Processing ${filePath}...`);

    // Read and parse YAML file
    const fileContent = await fs.readFile(filePath, "utf8");
    const data = yaml.load(fileContent) as YamlData;

    // Convert to Markdown
    const markdown = convertToMarkdown(data, path.basename(filePath));

    // Write Markdown file
    const outputPath = path.join(
      OUTPUT_DIR,
      path.basename(filePath, ".yml") + ".md"
    );
    await fs.writeFile(outputPath, markdown);

    console.log(`Created ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Get all YAML files
    const files = await fs.readdir(INPUT_DIR);
    const yamlFiles = files.filter((file) => file.endsWith(".yml"));

    console.log(`Found ${yamlFiles.length} YAML files to process`);

    // Process each file
    for (const file of yamlFiles) {
      await processFile(path.join(INPUT_DIR, file));
    }

    console.log("Conversion completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main();
