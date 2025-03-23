# YAML to Markdown Converter

This script converts YAML files from `_data/reference/ja/` to Markdown format and saves them in `reference/ja/`.

## Features

- Converts YAML structured data to Markdown
- Preserves hierarchy and formatting
- Handles complex nested structures
- Adds proper Markdown formatting for headings, code blocks, etc.

## Usage

To run the script:

```bash
# From the root directory
npm run yaml-to-md

# Or from the scripts/yaml-to-md directory
npm run start
```

## Input Format

The script expects YAML files with the following structure:

```yaml
Key:
  name: Name
  type: Type (class, function, enum, etc.)
  desc: |
    Description text
  code: |
    Example code
  args:
    - name: ArgName
      type: ArgType
      desc: Arg description
  fields:
    fieldName:
      name: FieldName
      type: FieldType
      desc: Field description
```

## Output Format

The script generates Markdown files with the following structure:

````markdown
---
layout: default
title: filename
---

# Name

**Type**: `Type`

Description text

```javascript
Example code
```
````

## Arguments

### ArgName

**Type**: `ArgType`

Arg description

## Fields

### FieldName

**Type**: `FieldType`

Field description

````

## Configuration

You can modify the input and output directories in the `index.ts` file:

```typescript
const INPUT_DIR = path.resolve("../../_data/reference/ja");
const OUTPUT_DIR = path.resolve("../../reference/ja");
````
